-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "priority" "TaskPriority";

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");
