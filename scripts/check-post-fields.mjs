import { config } from "dotenv";
config();
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const result = await prisma.$queryRaw`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'Post' ORDER BY ordinal_position
`;
console.log("Post columns in DB:", result.map(r => r.column_name));

await prisma.$disconnect();
await pool.end();
