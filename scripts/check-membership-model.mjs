import { config } from "dotenv";
config();
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// Check membershipConfig is accessible
const entry = await prisma.membershipConfig.findUnique({ where: { id: "default" } });
console.log("✅ MembershipConfig:", entry);

await prisma.$disconnect();
await pool.end();
