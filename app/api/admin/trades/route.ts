import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all trades with user info
    const trades = await prisma.trade.findMany({
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
      orderBy: { executedAt: "desc" },
    });

    // Return empty array if no trades - no mock data to avoid confusion
    return NextResponse.json({ trades });
  } catch (error) {
    console.error("Error fetching trades:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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

    if (
      !userId ||
      !tradeType ||
      !assetType ||
      !symbol ||
      !assetName ||
      !quantity ||
      !pricePerUnit
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const totalValue = quantity * pricePerUnit;
    const upperSymbol = symbol.toUpperCase();

    // Get or create portfolio for user
    let portfolio = await prisma.portfolio.findUnique({
      where: { userId },
    });

    if (!portfolio) {
      portfolio = await prisma.portfolio.create({
        data: {
          userId,
          totalValue: 0,
          cryptoValue: 0,
          stockValue: 0,
          cashValue: 0,
          totalInvested: 0,
          totalProfitLoss: 0,
        },
      });
    }

    // Create trade
    const trade = await prisma.trade.create({
      data: {
        userId,
        tradeType,
        assetType,
        symbol: upperSymbol,
        assetName,
        quantity,
        pricePerUnit,
        totalValue,
        adminNote,
        executedBy: session.user.email!,
        executedAt: new Date(),
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

    // Update holdings based on trade type
    const existingHolding = await prisma.holding.findFirst({
      where: {
        portfolioId: portfolio.id,
        symbol: upperSymbol,
      },
    });

    // Find USD cash holding for exchange
    const usdCashHolding = await prisma.holding.findFirst({
      where: {
        portfolioId: portfolio.id,
        symbol: "USD",
        assetType: "CASH",
      },
    });

    if (tradeType === "BUY") {
      // Check if user has enough USD cash for the purchase
      const availableCash = usdCashHolding ? Number(usdCashHolding.quantity) : 0;
      if (availableCash < totalValue) {
        return NextResponse.json(
          { error: `Insufficient USD balance. Available: $${availableCash.toFixed(2)}, Required: $${totalValue.toFixed(2)}` },
          { status: 400 }
        );
      }

      // Deduct USD cash for the purchase
      const newCashQuantity = availableCash - totalValue;
      if (newCashQuantity <= 0) {
        await prisma.holding.delete({
          where: { id: usdCashHolding!.id },
        });
      } else {
        await prisma.holding.update({
          where: { id: usdCashHolding!.id },
          data: {
            quantity: newCashQuantity,
            totalValue: newCashQuantity,
            lastPriceUpdate: new Date(),
          },
        });
      }

      // Add or update asset holding
      if (existingHolding) {
        // Update existing holding - calculate new average price
        const newQuantity = Number(existingHolding.quantity) + quantity;
        const totalCost = (Number(existingHolding.quantity) * Number(existingHolding.averageBuyPrice)) + totalValue;
        const newAvgPrice = totalCost / newQuantity;

        await prisma.holding.update({
          where: { id: existingHolding.id },
          data: {
            quantity: newQuantity,
            averageBuyPrice: newAvgPrice,
            currentPrice: pricePerUnit,
            totalValue: newQuantity * pricePerUnit,
            lastPriceUpdate: new Date(),
          },
        });
      } else {
        // Create new holding
        await prisma.holding.create({
          data: {
            portfolioId: portfolio.id,
            assetType,
            symbol: upperSymbol,
            name: assetName,
            quantity,
            averageBuyPrice: pricePerUnit,
            currentPrice: pricePerUnit,
            totalValue,
            profitLoss: 0,
            profitLossPercent: 0,
            lastPriceUpdate: new Date(),
          },
        });
      }
    } else if (tradeType === "SELL") {
      // Check if user has enough of the asset to sell
      if (!existingHolding || Number(existingHolding.quantity) < quantity) {
        const available = existingHolding ? Number(existingHolding.quantity) : 0;
        return NextResponse.json(
          { error: `Insufficient ${upperSymbol} balance. Available: ${available}, Required: ${quantity}` },
          { status: 400 }
        );
      }

      // Add USD cash from the sale
      if (usdCashHolding) {
        const newCashQuantity = Number(usdCashHolding.quantity) + totalValue;
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
            quantity: totalValue,
            averageBuyPrice: 1,
            currentPrice: 1,
            totalValue: totalValue,
            profitLoss: 0,
            profitLossPercent: 0,
            lastPriceUpdate: new Date(),
          },
        });
      }

      // Reduce or remove asset holding
      const newQuantity = Number(existingHolding.quantity) - quantity;
      if (newQuantity <= 0) {
        // Remove holding if quantity goes to 0 or below
        await prisma.holding.delete({
          where: { id: existingHolding.id },
        });
      } else {
        // Update holding quantity
        await prisma.holding.update({
          where: { id: existingHolding.id },
          data: {
            quantity: newQuantity,
            currentPrice: pricePerUnit,
            totalValue: newQuantity * pricePerUnit,
            lastPriceUpdate: new Date(),
          },
        });
      }
    }

    // Recalculate portfolio total value
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

    // Refetch portfolio to get current totalInvested value
    const updatedPortfolio = await prisma.portfolio.findUnique({
      where: { id: portfolio.id },
    });

    await prisma.portfolio.update({
      where: { id: portfolio.id },
      data: {
        totalValue: newTotalValue,
        cryptoValue,
        stockValue,
        cashValue,
        totalProfitLoss: newTotalValue - Number(updatedPortfolio?.totalInvested || 0),
        lastUpdated: new Date(),
      },
    });

    return NextResponse.json({ trade }, { status: 201 });
  } catch (error) {
    console.error("Error creating trade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
