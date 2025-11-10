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
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (priority && priority !== "ALL") {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        {
          user: {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    // Fetch support tickets
    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          take: 1, // Get first message for preview
        },
      },
      orderBy: [
        {
          status: "asc", // Open tickets first
        },
        {
          priority: "desc", // Then by priority
        },
        {
          createdAt: "desc", // Then by newest
        },
      ],
    });

    // Get statistics
    const stats = {
      open: await prisma.supportTicket.count({
        where: { status: "OPEN" },
      }),
      inProgress: await prisma.supportTicket.count({
        where: { status: "IN_PROGRESS" },
      }),
      resolved: await prisma.supportTicket.count({
        where: { status: "RESOLVED" },
      }),
      closed: await prisma.supportTicket.count({
        where: { status: "CLOSED" },
      }),
    };

    return NextResponse.json({ tickets, stats });
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
