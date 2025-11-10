import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Fetch user's watchlist
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const watchlist = await prisma.watchlistItem.findMany({
      where: { userId: session.user.id },
      orderBy: { addedAt: "desc" },
    });

    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add item to watchlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { symbol, name, assetType, logoUrl } = await request.json();

    if (!symbol || !name || !assetType) {
      return NextResponse.json(
        { error: "Symbol, name, and assetType are required" },
        { status: 400 }
      );
    }

    const item = await prisma.watchlistItem.create({
      data: {
        userId: session.user.id,
        symbol: symbol.toUpperCase(),
        name,
        assetType,
        logoUrl,
      },
    });

    return NextResponse.json({ item });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Item already in watchlist" },
        { status: 409 }
      );
    }
    console.error("Error adding to watchlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");

    if (!symbol) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    await prisma.watchlistItem.deleteMany({
      where: {
        userId: session.user.id,
        symbol: symbol.toUpperCase(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
