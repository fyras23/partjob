import { config } from "dotenv";
config();
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const client = await pool.connect();
try {
  await client.query(`ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "maxApplicants" INT`);
  console.log('✅ maxApplicants column added to Post');
} catch (e) { console.error("❌", e.message); }
finally { client.release(); await pool.end(); }
