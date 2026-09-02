import { config } from "dotenv";
config({ path: ".env.local" });
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const client = await pool.connect();

const apps = await client.query(`SELECT id, status, "studentId", "postId" FROM "Application" WHERE status = 'APPROVED' LIMIT 10`);
console.log("Approved applications:", apps.rows);

const convs = await client.query(`SELECT * FROM "Conversation" LIMIT 10`);
console.log("Conversations:", convs.rows);

client.release();
await pool.end();
