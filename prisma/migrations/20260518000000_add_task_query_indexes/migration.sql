-- Add indexes for common task list, dashboard, cleanup, and report queries.
CREATE INDEX "Project_workspaceId_idx" ON "Project"("workspaceId");

CREATE INDEX "Task_workspaceId_idx" ON "Task"("workspaceId");
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX "Task_workspaceId_status_idx" ON "Task"("workspaceId", "status");
CREATE INDEX "Task_projectId_status_idx" ON "Task"("projectId", "status");
CREATE INDEX "Task_workspaceId_dueDate_idx" ON "Task"("workspaceId", "dueDate");
CREATE INDEX "Task_projectId_position_idx" ON "Task"("projectId", "position");

CREATE INDEX "TaskAsset_taskId_idx" ON "TaskAsset"("taskId");

CREATE INDEX "Worklog_taskId_idx" ON "Worklog"("taskId");
CREATE INDEX "Worklog_memberId_idx" ON "Worklog"("memberId");
