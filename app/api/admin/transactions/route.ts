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

    // If no transactions yet, return mock data
    if (transactions.length === 0) {
      const mockTransactions = [
        {
          id: "tx_001",
          user: {
            id: "user_001",
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
          },
          transactionType: "DEPOSIT",
          amount: 10000,
          currency: "USD",
          method: "WIRE_TRANSFER",
          status: "PENDING",
          receiptUrl: null,
          blockchainTxId: null,
          bankReference: "WIRE2024001",
          adminNote: null,
          processedBy: null,
          processedAt: null,
          createdAt: new Date("2024-02-20T10:30:00").toISOString(),
          updatedAt: new Date("2024-02-20T10:30:00").toISOString(),
        },
        {
          id: "tx_002",
          user: {
            id: "user_002",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@example.com",
          },
          transactionType: "WITHDRAWAL",
          amount: 5000,
          currency: "USD",
          method: "WIRE_TRANSFER",
          status: "PENDING",
          receiptUrl: null,
          blockchainTxId: null,
          bankReference: "WIRE2024002",
          adminNote: null,
          processedBy: null,
          processedAt: null,
          createdAt: new Date("2024-02-19T15:20:00").toISOString(),
          updatedAt: new Date("2024-02-19T15:20:00").toISOString(),
        },
        {
          id: "tx_003",
          user: {
            id: "user_001",
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
          },
          transactionType: "DEPOSIT",
          amount: 25000,
          currency: "USD",
          method: "WIRE_TRANSFER",
          status: "COMPLETED",
          receiptUrl: null,
          blockchainTxId: null,
          bankReference: "WIRE2024003",
          adminNote: "Verified and approved",
          processedBy: "admin@coinshares.app",
          processedAt: new Date("2024-02-18T14:00:00").toISOString(),
          createdAt: new Date("2024-02-18T10:00:00").toISOString(),
          updatedAt: new Date("2024-02-18T14:00:00").toISOString(),
        },
      ];

      return NextResponse.json({ transactions: mockTransactions });
    }

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

    // Create transaction and auto-complete it (admin added)
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        transactionType,
        amount: parseFloat(amount),
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

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
