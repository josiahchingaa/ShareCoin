import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { isActive } = await request.json();
    const { userId } = await params;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    return NextResponse.json({
      message: "User status updated",
      user: {
        id: user.id,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
