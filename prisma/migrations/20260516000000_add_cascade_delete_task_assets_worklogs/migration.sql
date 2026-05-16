-- DropForeignKey
ALTER TABLE "TaskAsset" DROP CONSTRAINT "TaskAsset_taskId_fkey";

-- DropForeignKey
ALTER TABLE "Worklog" DROP CONSTRAINT "Worklog_taskId_fkey";

-- AddForeignKey
ALTER TABLE "TaskAsset" ADD CONSTRAINT "TaskAsset_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worklog" ADD CONSTRAINT "Worklog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
