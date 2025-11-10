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
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.user = {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // Fetch KYC documents
    const kycDocuments = await prisma.kYCDocument.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            kycStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    // Get statistics
    const stats = {
      pending: await prisma.kYCDocument.count({
        where: { status: "PENDING" },
      }),
      approved: await prisma.kYCDocument.count({
        where: { status: "APPROVED" },
      }),
      rejected: await prisma.kYCDocument.count({
        where: { status: "REJECTED" },
      }),
    };

    return NextResponse.json({ documents: kycDocuments, stats });
  } catch (error) {
    console.error("Error fetching KYC documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
