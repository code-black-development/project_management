-- AlterEnum
ALTER TYPE "RecurrenceFrequency" ADD VALUE 'FORTNIGHTLY';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "seriesId" TEXT;

-- CreateIndex
CREATE INDEX "Task_seriesId_idx" ON "Task"("seriesId");
