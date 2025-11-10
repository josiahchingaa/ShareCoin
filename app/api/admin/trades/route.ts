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

    // If no trades yet, return mock data
    if (trades.length === 0) {
      const mockTrades = [
        {
          id: "trade_001",
          user: {
            id: "user_001",
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
          },
          tradeType: "BUY",
          assetType: "CRYPTO",
          symbol: "BTC",
          assetName: "Bitcoin",
          quantity: 0.5,
          pricePerUnit: 45000,
          totalValue: 22500,
          adminNote: "Initial investment",
          executedBy: "admin@coinshares.app",
          executedAt: new Date("2024-02-15T10:00:00").toISOString(),
          createdAt: new Date("2024-02-15T10:00:00").toISOString(),
        },
        {
          id: "trade_002",
          user: {
            id: "user_002",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@example.com",
          },
          tradeType: "BUY",
          assetType: "CRYPTO",
          symbol: "ETH",
          assetName: "Ethereum",
          quantity: 10,
          pricePerUnit: 2500,
          totalValue: 25000,
          adminNote: null,
          executedBy: "admin@coinshares.app",
          executedAt: new Date("2024-02-16T14:30:00").toISOString(),
          createdAt: new Date("2024-02-16T14:30:00").toISOString(),
        },
        {
          id: "trade_003",
          user: {
            id: "user_001",
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
          },
          tradeType: "SELL",
          assetType: "CRYPTO",
          symbol: "BTC",
          assetName: "Bitcoin",
          quantity: 0.2,
          pricePerUnit: 47000,
          totalValue: 9400,
          adminNote: "Partial profit taking",
          executedBy: "admin@coinshares.app",
          executedAt: new Date("2024-02-20T09:15:00").toISOString(),
          createdAt: new Date("2024-02-20T09:15:00").toISOString(),
        },
      ];

      return NextResponse.json({ trades: mockTrades });
    }

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

    // Create trade
    const trade = await prisma.trade.create({
      data: {
        userId,
        tradeType,
        assetType,
        symbol: symbol.toUpperCase(),
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

    return NextResponse.json({ trade }, { status: 201 });
  } catch (error) {
    console.error("Error creating trade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
