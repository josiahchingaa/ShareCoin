import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        countryCode: true,
        nationality: true,
        timezone: true,
        employmentStatus: true,
        occupation: true,
        sourceOfFunds: true,
        kycStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      phone,
      address,
      city,
      postalCode,
      country,
      countryCode,
      nationality,
      timezone,
      employmentStatus,
      occupation,
      sourceOfFunds
    } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        phone,
        address,
        city,
        postalCode,
        country,
        countryCode,
        nationality,
        timezone,
        employmentStatus,
        occupation,
        sourceOfFunds: sourceOfFunds || [],
      },
      select: {
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        countryCode: true,
        nationality: true,
        timezone: true,
        employmentStatus: true,
        occupation: true,
        sourceOfFunds: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
