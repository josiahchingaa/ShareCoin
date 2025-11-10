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
