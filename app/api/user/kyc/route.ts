import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const passport = formData.get("passport") as File | null;
    const proofOfAddress = formData.get("proofOfAddress") as File | null;
    const wealthStatement = formData.get("wealthStatement") as File | null;

    if (!passport && !proofOfAddress) {
      return NextResponse.json(
        { error: "At least passport or proof of address is required" },
        { status: 400 }
      );
    }

    // In a real application, you would:
    // 1. Upload files to cloud storage (S3, Cloudinary, etc.)
    // 2. Create KYC document records with file URLs
    // For now, we'll just create placeholder document records

    const documents: Array<{
      type: "GOVERNMENT_ID" | "PROOF_OF_ADDRESS" | "WEALTH_STATEMENT";
      file: File;
    }> = [];

    if (passport) documents.push({ type: "GOVERNMENT_ID", file: passport });
    if (proofOfAddress) documents.push({ type: "PROOF_OF_ADDRESS", file: proofOfAddress });
    if (wealthStatement) documents.push({ type: "WEALTH_STATEMENT", file: wealthStatement });

    // Create KYC document records
    for (const doc of documents) {
      await prisma.kYCDocument.create({
        data: {
          userId: session.user.id,
          documentType: doc.type,
          fileUrl: `/uploads/kyc/${session.user.id}/${doc.type.toLowerCase()}.pdf`, // Placeholder URL
          fileName: doc.file.name,
          fileSize: doc.file.size,
          mimeType: doc.file.type || "application/pdf",
          status: "PENDING",
        },
      });
    }

    // Update user KYC status to PENDING
    await prisma.user.update({
      where: { id: session.user.id },
      data: { kycStatus: "PENDING" },
    });

    return NextResponse.json({
      message: "KYC documents uploaded successfully",
      status: "PENDING"
    });
  } catch (error) {
    console.error("Error uploading KYC documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
