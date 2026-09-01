import { config } from "dotenv";
config();

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const EMAIL = "admin@partjob.com";
const PASSWORD = "admin5400";

try {
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (existing) {
    console.log("⚠️  Admin already exists:", EMAIL);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const admin = await prisma.user.create({
    data: {
      email: EMAIL,
      passwordHash,
      name: "Admin",
      role: "ADMIN",
    },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  console.log("✅ Admin created:", admin);
} catch (e) {
  console.error("❌ Error:", e.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
  await pool.end();
}
