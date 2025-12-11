import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { tradeId } = await params;
    const {
      userId,
      tradeType,
      assetType,
      symbol,
      assetName,
      quantity,
      pricePerUnit,
      adminNote,
    } = await request.json();

    const totalValue = quantity * pricePerUnit;

    const trade = await prisma.trade.update({
      where: { id: tradeId },
      data: {
        userId,
        tradeType,
        assetType,
        symbol: symbol.toUpperCase(),
        assetName,
        quantity,
        pricePerUnit,
        totalValue,
        adminNote: adminNote || null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ trade });
  } catch (error) {
    console.error("Error updating trade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { tradeId } = await params;

    // Get the trade details before deleting
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    // Get user's portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: trade.userId },
    });

    if (portfolio) {
      // Find the holding for this asset
      const holding = await prisma.holding.findFirst({
        where: {
          portfolioId: portfolio.id,
          symbol: trade.symbol,
        },
      });

      // Find USD cash holding for cash reversal
      const usdCashHolding = await prisma.holding.findFirst({
        where: {
          portfolioId: portfolio.id,
          symbol: "USD",
          assetType: "CASH",
        },
      });

      if (trade.tradeType === "BUY") {
        // Reverse BUY: reduce asset holding, restore USD cash
        if (holding) {
          const newQuantity = Number(holding.quantity) - Number(trade.quantity);

          if (newQuantity <= 0) {
            // Remove holding if quantity goes to 0 or below
            await prisma.holding.delete({
              where: { id: holding.id },
            });
          } else {
            await prisma.holding.update({
              where: { id: holding.id },
              data: {
                quantity: newQuantity,
                totalValue: newQuantity * Number(holding.currentPrice),
                lastPriceUpdate: new Date(),
              },
            });
          }
        }

        // Restore USD cash that was spent
        if (usdCashHolding) {
          const newCashQuantity = Number(usdCashHolding.quantity) + Number(trade.totalValue);
          await prisma.holding.update({
            where: { id: usdCashHolding.id },
            data: {
              quantity: newCashQuantity,
              totalValue: newCashQuantity,
              lastPriceUpdate: new Date(),
            },
          });
        } else {
          // Create USD cash holding if it doesn't exist
          await prisma.holding.create({
            data: {
              portfolioId: portfolio.id,
              assetType: "CASH",
              symbol: "USD",
              name: "US Dollar",
              quantity: Number(trade.totalValue),
              averageBuyPrice: 1,
              currentPrice: 1,
              totalValue: Number(trade.totalValue),
              profitLoss: 0,
              profitLossPercent: 0,
              lastPriceUpdate: new Date(),
            },
          });
        }
      } else if (trade.tradeType === "SELL") {
        // Reverse SELL: restore asset holding, reduce USD cash
        if (holding) {
          const newQuantity = Number(holding.quantity) + Number(trade.quantity);
          await prisma.holding.update({
            where: { id: holding.id },
            data: {
              quantity: newQuantity,
              totalValue: newQuantity * Number(holding.currentPrice),
              lastPriceUpdate: new Date(),
            },
          });
        } else {
          // Recreate the holding if it doesn't exist
          await prisma.holding.create({
            data: {
              portfolioId: portfolio.id,
              assetType: trade.assetType,
              symbol: trade.symbol,
              name: trade.assetName,
              quantity: Number(trade.quantity),
              averageBuyPrice: Number(trade.pricePerUnit),
              currentPrice: Number(trade.pricePerUnit),
              totalValue: Number(trade.totalValue),
              profitLoss: 0,
              profitLossPercent: 0,
              lastPriceUpdate: new Date(),
            },
          });
        }

        // Remove USD cash that was received from the sale
        if (usdCashHolding) {
          const newCashQuantity = Number(usdCashHolding.quantity) - Number(trade.totalValue);
          if (newCashQuantity <= 0) {
            await prisma.holding.delete({
              where: { id: usdCashHolding.id },
            });
          } else {
            await prisma.holding.update({
              where: { id: usdCashHolding.id },
              data: {
                quantity: newCashQuantity,
                totalValue: newCashQuantity,
                lastPriceUpdate: new Date(),
              },
            });
          }
        }
      }

      // Recalculate portfolio totals
      const allHoldings = await prisma.holding.findMany({
        where: { portfolioId: portfolio.id },
      });

      const newTotalValue = allHoldings.reduce((sum, h) => sum + Number(h.totalValue), 0);
      const cryptoValue = allHoldings
        .filter(h => h.assetType === "CRYPTO")
        .reduce((sum, h) => sum + Number(h.totalValue), 0);
      const stockValue = allHoldings
        .filter(h => h.assetType === "STOCK")
        .reduce((sum, h) => sum + Number(h.totalValue), 0);
      const cashValue = allHoldings
        .filter(h => h.assetType === "CASH")
        .reduce((sum, h) => sum + Number(h.totalValue), 0);
      const commodityValue = allHoldings
        .filter(h => h.assetType === "COMMODITY")
        .reduce((sum, h) => sum + Number(h.totalValue), 0);

      await prisma.portfolio.update({
        where: { id: portfolio.id },
        data: {
          totalValue: newTotalValue,
          cryptoValue,
          stockValue,
          cashValue,
          totalProfitLoss: newTotalValue - Number(portfolio.totalInvested),
          lastUpdated: new Date(),
        },
      });
    }

    // Delete the trade
    await prisma.trade.delete({
      where: { id: tradeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting trade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
