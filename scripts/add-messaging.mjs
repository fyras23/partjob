import { config } from "dotenv";
config();
import { Pool } from "pg";
const pool   = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const client = await pool.connect();

const stmts = [
  `CREATE TABLE IF NOT EXISTS "Conversation" (
    "id"              STRING NOT NULL,
    "applicationId"   STRING NOT NULL,
    "recruiterUserId" STRING NOT NULL,
    "studentUserId"   STRING NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Conversation_applicationId_key" UNIQUE ("applicationId")
  )`,
  `CREATE TABLE IF NOT EXISTS "Message" (
    "id"             STRING NOT NULL,
    "conversationId" STRING NOT NULL,
    "senderId"       STRING NOT NULL,
    "content"        STRING NOT NULL,
    "readAt"         TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
  )`,
  `ALTER TABLE "Conversation" ADD CONSTRAINT IF NOT EXISTS "Conversation_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Message" ADD CONSTRAINT IF NOT EXISTS "Message_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Message" ADD CONSTRAINT IF NOT EXISTS "Message_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
];

try {
  for (const s of stmts) {
    await client.query(s);
    console.log("✅", s.slice(0, 60).replace(/\s+/g, " "));
  }
  console.log("\n🎉 Messaging tables ready.");
} catch (e) {
  console.error("❌", e.message);
} finally {
  client.release();
  await pool.end();
}
