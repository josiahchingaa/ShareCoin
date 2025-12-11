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

    // Get all transactions with user info
    const transactions = await prisma.transaction.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    // Return empty array if no transactions - no mock data to avoid confusion
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
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
      transactionType,
      amount,
      currency,
      method,
      bankReference,
      blockchainTxId,
      adminNote,
    } = await request.json();

    if (!userId || !transactionType || !amount || !currency || !method) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);

    // Create transaction and auto-complete it (admin added)
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        transactionType,
        amount: parsedAmount,
        currency,
        method,
        status: "COMPLETED",
        bankReference,
        blockchainTxId,
        adminNote,
        processedBy: session.user.email!,
        processedAt: new Date(),
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

    // Update portfolio cash balance
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

    // Calculate the change amount (positive for deposit, negative for withdrawal)
    const changeAmount = transactionType === "DEPOSIT" ? parsedAmount : -parsedAmount;

    // Update or create cash holding
    const cashSymbol = currency.toUpperCase();
    const existingCashHolding = await prisma.holding.findFirst({
      where: {
        portfolioId: portfolio.id,
        symbol: cashSymbol,
        assetType: "CASH",
      },
    });

    if (existingCashHolding) {
      const newQuantity = Number(existingCashHolding.quantity) + changeAmount;

      if (newQuantity <= 0) {
        // Remove cash holding if balance goes to 0 or below
        await prisma.holding.delete({
          where: { id: existingCashHolding.id },
        });
      } else {
        await prisma.holding.update({
          where: { id: existingCashHolding.id },
          data: {
            quantity: newQuantity,
            totalValue: newQuantity,
            lastPriceUpdate: new Date(),
          },
        });
      }
    } else if (changeAmount > 0) {
      // Create new cash holding only for deposits
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
          quantity: parsedAmount,
          averageBuyPrice: 1,
          currentPrice: 1,
          totalValue: parsedAmount,
          profitLoss: 0,
          profitLossPercent: 0,
          lastPriceUpdate: new Date(),
        },
      });
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

    // Update totalInvested only for deposits
    const investedChange = transactionType === "DEPOSIT" ? parsedAmount : 0;

    await prisma.portfolio.update({
      where: { id: portfolio.id },
      data: {
        totalValue: newTotalValue,
        cryptoValue,
        stockValue,
        cashValue,
        totalInvested: { increment: investedChange },
        lastUpdated: new Date(),
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
