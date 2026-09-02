import { config } from "dotenv";
config();
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const client = await pool.connect();

const stmts = [
  `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "fields"     STRING[] NOT NULL DEFAULT ARRAY[]::STRING[]`,
  `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "startDate"  TIMESTAMP`,
  `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "endDate"    TIMESTAMP`,
  `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "hourlyRate" FLOAT8`,
  `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "dailyRate"  FLOAT8`,
];

try {
  for (const s of stmts) {
    await client.query(s);
    console.log("✅", s.slice(0, 60));
  }
  console.log("\n🎉 Post columns added.");
} catch (e) {
  console.error("❌", e.message);
} finally {
  client.release();
  await pool.end();
}
