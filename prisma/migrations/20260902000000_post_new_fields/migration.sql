-- Add new fields to Post table
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "fields"     STRING[] NOT NULL DEFAULT ARRAY[]::STRING[];
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "startDate"  TIMESTAMP(3);
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "endDate"    TIMESTAMP(3);
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "hourlyRate" FLOAT8;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "dailyRate"  FLOAT8;

-- Add avatarUrl to User (in case it wasn't in previous migration)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" STRING;
