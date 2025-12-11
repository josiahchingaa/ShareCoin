import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { transactionId } = await params;
    const {
      userId,
      transactionType,
      amount,
      currency,
      method,
      blockchainTxId,
      bankReference,
      adminNote,
    } = await request.json();

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        userId,
        transactionType,
        amount,
        currency,
        method,
        blockchainTxId: blockchainTxId || null,
        bankReference: bankReference || null,
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

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { transactionId } = await params;

    // Get the transaction details before deleting
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Only reverse cash holdings for completed transactions
    if (transaction.status === "COMPLETED") {
      // Get user's portfolio
      const portfolio = await prisma.portfolio.findUnique({
        where: { userId: transaction.userId },
      });

      if (portfolio) {
        const cashSymbol = transaction.currency.toUpperCase();

        // Find the cash holding
        const cashHolding = await prisma.holding.findFirst({
          where: {
            portfolioId: portfolio.id,
            symbol: cashSymbol,
            assetType: "CASH",
          },
        });

        // Reverse the transaction effect
        if (transaction.transactionType === "DEPOSIT") {
          // If it was a DEPOSIT, we need to reduce cash
          if (cashHolding) {
            const newQuantity = Number(cashHolding.quantity) - Number(transaction.amount);

            if (newQuantity <= 0) {
              // Remove cash holding if balance goes to 0 or below
              await prisma.holding.delete({
                where: { id: cashHolding.id },
              });
            } else {
              await prisma.holding.update({
                where: { id: cashHolding.id },
                data: {
                  quantity: newQuantity,
                  totalValue: newQuantity,
                  lastPriceUpdate: new Date(),
                },
              });
            }
          }

          // Reduce totalInvested
          await prisma.portfolio.update({
            where: { id: portfolio.id },
            data: {
              totalInvested: { decrement: Number(transaction.amount) },
            },
          });
        } else if (transaction.transactionType === "WITHDRAWAL") {
          // If it was a WITHDRAWAL, we need to add cash back
          if (cashHolding) {
            const newQuantity = Number(cashHolding.quantity) + Number(transaction.amount);

            await prisma.holding.update({
              where: { id: cashHolding.id },
              data: {
                quantity: newQuantity,
                totalValue: newQuantity,
                lastPriceUpdate: new Date(),
              },
            });
          } else {
            // Recreate cash holding if it doesn't exist
            // Map currency symbols to professional names
            const currencyNames: Record<string, string> = {
              USD: "US Dollar",
              EUR: "Euro",
              GBP: "British Pound",
              CHF: "Swiss Franc",
              JPY: "Japanese Yen",
              AUD: "Australian Dollar",
              CAD: "Canadian Dollar",
            };
            const cashName = currencyNames[cashSymbol] || `${cashSymbol} Cash`;

            await prisma.holding.create({
              data: {
                portfolioId: portfolio.id,
                assetType: "CASH",
                symbol: cashSymbol,
                name: cashName,
                quantity: Number(transaction.amount),
                averageBuyPrice: 1,
                currentPrice: 1,
                totalValue: Number(transaction.amount),
                profitLoss: 0,
                profitLossPercent: 0,
                lastPriceUpdate: new Date(),
              },
            });
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
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
