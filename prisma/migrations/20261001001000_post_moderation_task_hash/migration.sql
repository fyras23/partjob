ALTER TABLE "PostModerationTask" SET (schema_locked = false);

ALTER TABLE "PostModerationTask"
  ADD COLUMN IF NOT EXISTS "contentHash" STRING NOT NULL DEFAULT '';

ALTER TABLE "PostModerationTask" SET (schema_locked = true);