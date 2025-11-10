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

    // Get total users
    const totalUsers = await prisma.user.count({
      where: {
        role: "CUSTOMER",
      },
    });

    // Get active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await prisma.user.count({
      where: {
        role: "CUSTOMER",
        lastLoginAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get pending KYC
    const pendingKyc = await prisma.user.count({
      where: {
        role: "CUSTOMER",
        kycStatus: "PENDING",
      },
    });

    // Get open support tickets (including IN_PROGRESS)
    const openTickets = await prisma.supportTicket.count({
      where: {
        status: {
          in: ["OPEN", "IN_PROGRESS"],
        },
      },
    });

    return NextResponse.json({
      totalUsers,
      activeUsers,
      pendingKyc,
      openTickets,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
