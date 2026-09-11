CREATE TABLE IF NOT EXISTS "StudentRating" (
  "id" STRING NOT NULL,
  "recruiterId" STRING NOT NULL,
  "studentId" STRING NOT NULL,
  "applicationId" STRING NOT NULL,
  "score" INT NOT NULL,
  "comment" STRING,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentRating_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudentRating_applicationId_key" UNIQUE ("applicationId")
);

CREATE INDEX IF NOT EXISTS "StudentRating_studentId_idx"
  ON "StudentRating"("studentId");

CREATE INDEX IF NOT EXISTS "StudentRating_recruiterId_idx"
  ON "StudentRating"("recruiterId");

ALTER TABLE "StudentRating"
  ADD CONSTRAINT "StudentRating_recruiterId_fkey"
  FOREIGN KEY ("recruiterId") REFERENCES "RecruiterProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StudentRating"
  ADD CONSTRAINT "StudentRating_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StudentRating"
  ADD CONSTRAINT "StudentRating_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
