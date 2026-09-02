import { config } from "dotenv";
config();
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const client = await pool.connect();

const stmts = [
  // Subscription enums
  `CREATE TYPE IF NOT EXISTS "SubscriptionPlan"   AS ENUM ('MONTHLY', 'YEARLY')`,
  `CREATE TYPE IF NOT EXISTS "SubscriptionStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'EXPIRED', 'CANCELLED')`,
  // New columns on RecruiterProfile
  `ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "subscriptionStatus"   "SubscriptionStatus" NOT NULL DEFAULT 'INACTIVE'`,
  `ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "subscriptionPlan"     "SubscriptionPlan"`,
  `ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "subscriptionStart"    TIMESTAMP(3)`,
  `ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "subscriptionEnd"      TIMESTAMP(3)`,
  `ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "stripeCustomerId"     STRING`,
  `ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" STRING`,
  // MembershipConfig table
  `CREATE TABLE IF NOT EXISTS "MembershipConfig" (
    "id"              STRING        NOT NULL DEFAULT 'default',
    "monthlyPrice"    FLOAT8        NOT NULL DEFAULT 29,
    "yearlyPrice"     FLOAT8        NOT NULL DEFAULT 290,
    "monthlyDiscount" FLOAT8        NOT NULL DEFAULT 0,
    "yearlyDiscount"  FLOAT8        NOT NULL DEFAULT 0,
    "currency"        STRING        NOT NULL DEFAULT 'DT',
    "updatedAt"       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MembershipConfig_pkey" PRIMARY KEY ("id")
  )`,
  // Seed default config row
  `INSERT INTO "MembershipConfig" ("id") VALUES ('default') ON CONFLICT DO NOTHING`,
];

try {
  for (const s of stmts) {
    await client.query(s);
    console.log("✅", s.slice(0, 70).replace(/\s+/g, " "));
  }
  console.log("\n🎉 Membership tables ready.");
} catch (e) {
  console.error("❌", e.message);
} finally {
  client.release();
  await pool.end();
}
