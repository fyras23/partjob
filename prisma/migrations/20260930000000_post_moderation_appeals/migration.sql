ALTER TABLE "Post" SET (schema_locked = false);

ALTER TABLE "Post"
  ADD COLUMN IF NOT EXISTS "moderationReason" STRING,
  ADD COLUMN IF NOT EXISTS "rejectionReason" STRING,
  ADD COLUMN IF NOT EXISTS "appealMessage" STRING,
  ADD COLUMN IF NOT EXISTS "appealedAt" TIMESTAMP(3);

ALTER TABLE "Post" SET (schema_locked = true);