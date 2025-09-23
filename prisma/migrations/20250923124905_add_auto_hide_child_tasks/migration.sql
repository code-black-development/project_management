-- Add autoHideChildTasks column to Project table
-- This is safe because:
-- 1. The column is nullable, so existing rows won't be affected
-- 2. The application already handles null values by defaulting to false
-- 3. No data loss will occur

ALTER TABLE "Project" ADD COLUMN "autoHideChildTasks" BOOLEAN;