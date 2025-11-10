import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding admin user...");

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    console.log("✓ Admin user already exists:", existingAdmin.email);
    return;
  }

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@coinshares.app";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      language: "EN",
      kycStatus: "APPROVED",
      emailVerified: true,
      isActive: true,
      accountType: null, // Admin doesn't need account type
    },
  });

  console.log("✓ Admin user created successfully!");
  console.log("  Email:", admin.email);
  console.log("  Password:", adminPassword);
  console.log("  ID:", admin.id);
  console.log("\n⚠️  Please change the admin password after first login!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
