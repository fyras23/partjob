import { config } from "dotenv";
config();
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// Try to read Post fields from the DB directly
const result = await prisma.$queryRaw`
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'Post' 
  ORDER BY ordinal_position
`;
console.log("DB columns:", result.map(r => r.column_name));

// Try a dummy create to see if fields is accepted
try {
  const dmmf = (prisma)._runtimeDataModel;
  const postFields = Object.keys(dmmf?.models?.Post?.fields ?? {});
  console.log("Prisma client knows about:", postFields);
} catch (e) {
  console.log("Could not read DMMF:", e.message);
}

await prisma.$disconnect();
await pool.end();
