import { config } from "dotenv";
config();

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  // Insert
  const job = await prisma.job.create({
    data: {
      id: crypto.randomUUID(),
      jobName: "Frontend Developer",
      description: "Build awesome UIs with Next.js",
      imageUrl: "https://example.com/image.png",
    },
  });
  console.log("✅ Inserted:", job);

  // Read back
  const found = await prisma.job.findUnique({ where: { id: job.id } });
  console.log("✅ Read back:", found);

  // Clean up
  await prisma.job.delete({ where: { id: job.id } });
  console.log("✅ Cleaned up");

  console.log("\n🎉 Job table is working perfectly!");
} catch (e) {
  console.error("❌", e.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
  await pool.end();
}
