import { config } from "dotenv";
config();
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const client = await pool.connect();

try {
  await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" STRING`);
  console.log('✅ avatarUrl column added to "User"');
} catch (e) {
  console.error("❌", e.message);
} finally {
  client.release();
  await pool.end();
}
