import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { documentId } = await params;
    const { status, rejectionReason } = await request.json();

    // Update the document
    const document = await prisma.kYCDocument.update({
      where: { id: documentId },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
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

    // Check if user has all documents approved
    if (status === "APPROVED") {
      const userDocuments = await prisma.kYCDocument.findMany({
        where: { userId: document.userId },
      });

      const allApproved = userDocuments.every(
        (doc) => doc.status === "APPROVED"
      );

      // If all documents are approved and user has at least 3 documents
      // (GOVERNMENT_ID, PROOF_OF_ADDRESS, WEALTH_STATEMENT)
      if (allApproved && userDocuments.length >= 3) {
        await prisma.user.update({
          where: { id: document.userId },
          data: {
            kycStatus: "APPROVED",
            kycApprovedAt: new Date(),
            kycApprovedBy: session.user.id,
            kycRejectionReason: null,
          },
        });
      }
    }

    // If rejecting, update user KYC status
    if (status === "REJECTED") {
      await prisma.user.update({
        where: { id: document.userId },
        data: {
          kycStatus: "REJECTED",
          kycRejectionReason: rejectionReason || "Document rejected",
        },
      });
    }

    // Create activity log
    await prisma.activityLog.create({
      data: {
        actorId: session.user.id,
        actorRole: "ADMIN",
        actionType: status === "APPROVED" ? "KYC_APPROVED" : "KYC_REJECTED",
        targetType: "KYC_DOCUMENT",
        targetId: documentId,
        description: `${status === "APPROVED" ? "Approved" : "Rejected"} ${
          document.documentType
        } document for ${document.user.firstName} ${document.user.lastName}`,
        metadata: {
          userId: document.userId,
          documentType: document.documentType,
          rejectionReason: rejectionReason || null,
        },
      },
    });

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Error updating KYC document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
