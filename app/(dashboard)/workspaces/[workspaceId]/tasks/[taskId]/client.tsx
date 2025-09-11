"use client";

import DottedSeparator from "@/components/dotted-separator";
import PageError from "@/components/page-error";
import PageLoader from "@/components/page-loader";
import TaskAssets from "@/features/tasks/_components/task-assets";
import TaskBreadcrumbs from "@/features/tasks/_components/task-breadcrumbs";
import TaskDescription from "@/features/tasks/_components/task-description";
import TaskOverview from "@/features/tasks/_components/task-overview";
import TaskWorklog from "@/features/tasks/_components/task-worklog";
import { useGetTask } from "@/features/tasks/api/use-get-task";
import { useTaskId } from "@/features/tasks/hooks/use-task-id";
import { TaskWithUser } from "@/types/types";

export const TaskIdClient = () => {
  const taskId = useTaskId();
  const { data, isLoading } = useGetTask({ taskId });

  if (isLoading) {
    return <PageLoader />;
  }

  if (!data) {
    return <PageError message="Task not found" />;
  }

  // Type assertion to TaskWithUser for component compatibility
  const task = data as unknown as TaskWithUser;

  return (
    <div className="flex flex-col">
      <TaskBreadcrumbs project={task.project!} task={task} />
      <DottedSeparator className="my-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TaskOverview task={task} />
        <TaskDescription task={task} />
        <TaskWorklog task={task} />
        <TaskAssets task={task} />
      </div>
    </div>
  );
};
