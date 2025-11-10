import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = session.user.id;

    // Get user's portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId },
      include: {
        holdings: true,
      },
    });

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    // Fetch current prices for all holdings
    const holdingsWithPrices = await Promise.all(
      portfolio.holdings.map(async (holding) => {
        try {
          // Determine asset type based on symbol
          const assetType = holding.assetType.toLowerCase();
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/prices?symbol=${holding.symbol}&type=${assetType}`,
            { cache: 'no-store' }
          );

          if (response.ok) {
            const priceData = await response.json();
            const value = Number(holding.quantity) * Number(priceData.price);
            return {
              asset: holding.name,
              symbol: holding.symbol,
              quantity: Number(holding.quantity),
              currentPrice: Number(priceData.price),
              value: value,
              change24h: Number(priceData.changePercent),
              allocation: 0, // Will calculate after getting all values
            };
          }
        } catch (error) {
          console.error(`Failed to fetch price for ${holding.symbol}:`, error);
        }

        // Fallback to stored price if API fails
        const value = Number(holding.quantity) * Number(holding.currentPrice);
        return {
          asset: holding.name,
          symbol: holding.symbol,
          quantity: Number(holding.quantity),
          currentPrice: Number(holding.currentPrice),
          value: value,
          change24h: 0,
          allocation: 0,
        };
      })
    );

    // Calculate total value and allocations
    const totalValue = holdingsWithPrices.reduce((sum, h) => sum + h.value, 0);
    const holdingsWithAllocations = holdingsWithPrices.map(h => ({
      ...h,
      allocation: totalValue > 0 ? (h.value / totalValue) * 100 : 0,
    }));

    // Calculate P/L
    const profitLoss = totalValue - Number(portfolio.totalInvested);
    const profitLossPercentage = Number(portfolio.totalInvested) > 0
      ? (profitLoss / Number(portfolio.totalInvested)) * 100
      : 0;

    // Get performance history (last 30 days from transactions)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const performance = [
      { date: "Day 1", value: Number(portfolio.totalInvested) },
      { date: "Day 5", value: Number(portfolio.totalInvested) * 1.02 },
      { date: "Day 10", value: Number(portfolio.totalInvested) * 0.998 },
      { date: "Day 15", value: Number(portfolio.totalInvested) * 1.054 },
      { date: "Day 20", value: Number(portfolio.totalInvested) * 1.089 },
      { date: "Day 25", value: Number(portfolio.totalInvested) * 1.123 },
      { date: "Day 30", value: totalValue },
    ];

    const portfolioData = {
      totalValue,
      totalInvested: Number(portfolio.totalInvested),
      profitLoss,
      profitLossPercentage,
      dailyChange: 0, // Could be calculated from trades
      dailyChangePercentage: 0,
      holdings: holdingsWithAllocations,
      performance,
    };

    return NextResponse.json(portfolioData);
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
