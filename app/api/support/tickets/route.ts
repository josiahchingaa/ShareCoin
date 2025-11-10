import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = session.user.id;

    // Get user's support tickets from database
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // If no tickets yet, return mock data
    if (tickets.length === 0) {
      const mockTickets = [
        {
          id: "ticket_001",
          subject: "Question about withdrawal limits",
          status: "OPEN",
          priority: "NORMAL",
          category: null,
          createdAt: new Date("2024-02-15T10:30:00").toISOString(),
          updatedAt: new Date("2024-02-15T10:30:00").toISOString(),
          lastReplyAt: new Date("2024-02-15T14:20:00").toISOString(),
          closedAt: null,
          messages: [
            {
              id: "msg_001",
              senderId: userId,
              senderRole: "CUSTOMER",
              message:
                "I would like to know what the daily withdrawal limit is for my account. Can you please provide this information?",
              attachmentUrl: null,
              attachmentName: null,
              createdAt: new Date("2024-02-15T10:30:00").toISOString(),
            },
            {
              id: "msg_002",
              senderId: "admin_001",
              senderRole: "ADMIN",
              message:
                "Thank you for contacting us. Your daily withdrawal limit is $50,000. If you need to increase this limit, please provide additional documentation for verification.",
              attachmentUrl: null,
              attachmentName: null,
              createdAt: new Date("2024-02-15T14:20:00").toISOString(),
            },
          ],
        },
        {
          id: "ticket_002",
          subject: "KYC verification status",
          status: "CLOSED",
          priority: "HIGH",
          category: null,
          createdAt: new Date("2024-02-10T09:15:00").toISOString(),
          updatedAt: new Date("2024-02-11T16:45:00").toISOString(),
          lastReplyAt: new Date("2024-02-11T16:45:00").toISOString(),
          closedAt: new Date("2024-02-11T16:45:00").toISOString(),
          messages: [
            {
              id: "msg_003",
              senderId: userId,
              senderRole: "CUSTOMER",
              message:
                "I submitted my KYC documents 3 days ago. Can you please check the status of my verification?",
              attachmentUrl: null,
              attachmentName: null,
              createdAt: new Date("2024-02-10T09:15:00").toISOString(),
            },
            {
              id: "msg_004",
              senderId: "admin_001",
              senderRole: "ADMIN",
              message:
                "We have reviewed your KYC documents and they have been approved. Your account is now fully verified. Thank you for your patience!",
              attachmentUrl: null,
              attachmentName: null,
              createdAt: new Date("2024-02-11T16:45:00").toISOString(),
            },
          ],
        },
      ];

      return NextResponse.json({ tickets: mockTickets });
    }

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = session.user.id;
    const { subject, message, priority } = await request.json();

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Create ticket with initial message
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject,
        priority: priority || "NORMAL",
        status: "OPEN",
        messages: {
          create: {
            senderId: userId,
            senderRole: "CUSTOMER",
            message,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error("Error creating support ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
