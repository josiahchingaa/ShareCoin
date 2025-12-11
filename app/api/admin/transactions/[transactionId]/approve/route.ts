import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { transactionId } = await params;

    // Check if this is a mock transaction ID (starts with tx_)
    if (transactionId.startsWith("tx_")) {
      return NextResponse.json(
        { error: "Cannot modify sample data. Create real transactions first." },
        { status: 400 }
      );
    }

    // Check if transaction exists first
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "COMPLETED",
        processedBy: session.user.email!,
        processedAt: new Date(),
        adminNote: "Approved by admin",
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
    console.error("Error approving transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
