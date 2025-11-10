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

    const { searchParams } = new URL(request.url);
    const actionType = searchParams.get("actionType");
    const actorRole = searchParams.get("actorRole");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where clause
    const where: any = {};

    if (actionType && actionType !== "ALL") {
      where.actionType = actionType;
    }

    if (actorRole && actorRole !== "ALL") {
      where.actorRole = actorRole;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { targetType: { contains: search, mode: "insensitive" } },
        {
          actor: {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    // Fetch activity logs
    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    // Get statistics
    const stats = {
      totalLogs: await prisma.activityLog.count(),
      adminActions: await prisma.activityLog.count({
        where: { actorRole: "ADMIN" },
      }),
      customerActions: await prisma.activityLog.count({
        where: { actorRole: "CUSTOMER" },
      }),
      last24Hours: await prisma.activityLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    };

    return NextResponse.json({ logs, stats });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
