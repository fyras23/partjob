import { config } from "dotenv";
config(); // loads .env → DATABASE_URL

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.$queryRaw`SELECT version()`;
  console.log("✅ Prisma connected to CockroachDB!");
  console.log("   Version:", result[0].version);
}

main()
  .catch((e) => {
    console.error("❌ Prisma connection failed:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
