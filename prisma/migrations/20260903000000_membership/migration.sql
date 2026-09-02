-- CreateEnum
CREATE TYPE IF NOT EXISTS "SubscriptionPlan" AS ENUM ('MONTHLY', 'YEARLY');
CREATE TYPE IF NOT EXISTS "SubscriptionStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- Add subscription columns to RecruiterProfile
ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "subscriptionStatus"   "SubscriptionStatus" NOT NULL DEFAULT 'INACTIVE';
ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "subscriptionPlan"     "SubscriptionPlan";
ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "subscriptionStart"    TIMESTAMP(3);
ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "subscriptionEnd"      TIMESTAMP(3);
ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "stripeCustomerId"     STRING;
ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" STRING;

-- MembershipConfig table
CREATE TABLE IF NOT EXISTS "MembershipConfig" (
  "id"              STRING       NOT NULL DEFAULT 'default',
  "monthlyPrice"    FLOAT8       NOT NULL DEFAULT 29,
  "yearlyPrice"     FLOAT8       NOT NULL DEFAULT 290,
  "monthlyDiscount" FLOAT8       NOT NULL DEFAULT 0,
  "yearlyDiscount"  FLOAT8       NOT NULL DEFAULT 0,
  "currency"        STRING       NOT NULL DEFAULT 'DT',
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MembershipConfig_pkey" PRIMARY KEY ("id")
);

INSERT INTO "MembershipConfig" ("id") VALUES ('default') ON CONFLICT DO NOTHING;
