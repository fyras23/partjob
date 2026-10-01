CREATE TABLE IF NOT EXISTS "Notification" (
  "id" STRING NOT NULL,
  "userId" STRING NOT NULL,
  "type" STRING NOT NULL,
  "status" STRING NOT NULL,
  "title" STRING NOT NULL,
  "message" STRING NOT NULL,
  "postId" STRING,
  "conversationId" STRING,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "Notification" SET (schema_locked = false);

CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx"
  ON "Notification"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_idx"
  ON "Notification"("userId", "readAt");

ALTER TABLE "Notification" SET (schema_locked = true);