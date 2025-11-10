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

    // Get all users with their trades
    const users = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        trades: {
          select: {
            tradeType: true,
            assetType: true,
            symbol: true,
            assetName: true,
            quantity: true,
            pricePerUnit: true,
            totalValue: true,
            executedAt: true,
          },
          orderBy: {
            executedAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate portfolio for each user
    const portfolios = users.map((user) => {
      // Aggregate holdings by symbol
      const holdingsMap = new Map<
        string,
        {
          symbol: string;
          assetName: string;
          assetType: string;
          quantity: number;
          totalInvested: number;
          averagePrice: number;
        }
      >();

      user.trades.forEach((trade) => {
        const existing = holdingsMap.get(trade.symbol);

        if (trade.tradeType === "BUY") {
          if (existing) {
            const newQuantity = existing.quantity + Number(trade.quantity);
            const newTotalInvested = existing.totalInvested + Number(trade.totalValue);
            existing.quantity = newQuantity;
            existing.totalInvested = newTotalInvested;
            existing.averagePrice = newTotalInvested / newQuantity;
          } else {
            holdingsMap.set(trade.symbol, {
              symbol: trade.symbol,
              assetName: trade.assetName,
              assetType: trade.assetType,
              quantity: Number(trade.quantity),
              totalInvested: Number(trade.totalValue),
              averagePrice: Number(trade.pricePerUnit),
            });
          }
        } else if (trade.tradeType === "SELL") {
          if (existing) {
            existing.quantity -= Number(trade.quantity);
            // Reduce invested amount proportionally
            const soldRatio = Number(trade.quantity) / (existing.quantity + Number(trade.quantity));
            existing.totalInvested -= existing.totalInvested * soldRatio;

            // Remove if quantity is 0 or negative
            if (existing.quantity <= 0) {
              holdingsMap.delete(trade.symbol);
            } else {
              existing.averagePrice = existing.totalInvested / existing.quantity;
            }
          }
        }
      });

      // Convert map to array and calculate totals
      const holdings = Array.from(holdingsMap.values()).filter(
        (h) => h.quantity > 0
      );

      const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
      const totalAssets = holdings.length;

      return {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          createdAt: user.createdAt,
        },
        holdings,
        totalAssets,
        totalInvested,
        totalTrades: user.trades.length,
      };
    });

    // Calculate global stats
    const totalAUM = portfolios.reduce((sum, p) => sum + p.totalInvested, 0);
    const totalUsers = portfolios.length;
    const activeUsers = portfolios.filter((p) => p.holdings.length > 0).length;

    return NextResponse.json({
      portfolios,
      stats: {
        totalAUM,
        totalUsers,
        activeUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching portfolios:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
