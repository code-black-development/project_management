-- Queue S3 objects that could not be deleted after the database has already committed.
CREATE TABLE "S3CleanupJob" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "context" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "processedAt" TIMESTAMP(3),

  CONSTRAINT "S3CleanupJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "S3CleanupJob_key_key" ON "S3CleanupJob"("key");
CREATE INDEX "S3CleanupJob_processedAt_updatedAt_idx" ON "S3CleanupJob"("processedAt", "updatedAt");
