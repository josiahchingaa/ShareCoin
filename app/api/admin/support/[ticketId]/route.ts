import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get ticket details with all messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { ticketId } = await params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
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
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Error fetching ticket details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Reply to a ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { ticketId } = await params;
    const { message } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Create the reply message
    const reply = await prisma.supportMessage.create({
      data: {
        ticketId,
        senderId: session.user.id!,
        senderRole: "ADMIN",
        message: message.trim(),
      },
    });

    // Update ticket status and lastReplyAt
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: "IN_PROGRESS",
        lastReplyAt: new Date(),
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        actorId: session.user.id!,
        actorRole: "ADMIN",
        actionType: "SUPPORT_REPLY",
        targetType: "SUPPORT_TICKET",
        targetId: ticketId,
        description: `Replied to support ticket`,
      },
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Error replying to ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update ticket status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { ticketId } = await params;
    const { status, priority } = await request.json();

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === "CLOSED") {
        updateData.closedAt = new Date();
      }
    }

    if (priority) {
      updateData.priority = priority;
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
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

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
