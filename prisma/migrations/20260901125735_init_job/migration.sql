-- CreateTable
CREATE TABLE "job" (
    "id" STRING NOT NULL,
    "jobName" STRING NOT NULL,
    "description" STRING NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageUrl" STRING,

    CONSTRAINT "job_pkey" PRIMARY KEY ("id")
);
