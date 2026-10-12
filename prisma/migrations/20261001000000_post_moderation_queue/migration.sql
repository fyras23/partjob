CREATE TABLE IF NOT EXISTS "PostModerationTask" (
  "id" STRING NOT NULL,
  "postId" STRING NOT NULL,
  "status" STRING NOT NULL DEFAULT 'QUEUED',
  "attempts" INT NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "lastError" STRING,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostModerationTask_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PostModerationTask_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "PostModerationTask" SET (schema_locked = false);

CREATE INDEX IF NOT EXISTS "PostModerationTask_status_availableAt_createdAt_idx"
  ON "PostModerationTask"("status", "availableAt", "createdAt");

CREATE INDEX IF NOT EXISTS "PostModerationTask_postId_createdAt_idx"
  ON "PostModerationTask"("postId", "createdAt");

ALTER TABLE "PostModerationTask" SET (schema_locked = true);