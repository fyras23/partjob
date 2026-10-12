import { config } from "dotenv";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });
config();

const EMAIL = process.env.ADMIN_EMAIL ?? "admin@partjob.com";
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!PASSWORD) {
  throw new Error("ADMIN_PASSWORD environment variable is required");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { passwordHash, name: "Admin", role: "ADMIN" },
    create: {
      email: EMAIL,
      passwordHash,
      name: "Admin",
      role: "ADMIN",
    },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  console.log("Admin account ready:", admin);
} catch (e) {
  console.error("Admin seeding failed:", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
  await pool.end();
}
