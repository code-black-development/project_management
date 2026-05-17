"use client";

import PageError from "@/components/page-error";
import PageLoader from "@/components/page-loader";
import TaskAssets from "@/features/tasks/_components/task-assets";
import TaskBreadcrumbs from "@/features/tasks/_components/task-breadcrumbs";
import TaskDescription from "@/features/tasks/_components/task-description";
import TaskOverview from "@/features/tasks/_components/task-overview";
import TaskWorklog from "@/features/tasks/_components/task-worklog";
import TaskChildren from "@/features/tasks/_components/task-children";
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

  const task = data as unknown as TaskWithUser;

  return (
    <div className="flex flex-col gap-y-6">
      <TaskBreadcrumbs project={task.project!} task={task} />
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <div className="flex flex-col gap-y-4 min-w-0">
          <TaskOverview task={task} />
          <TaskChildren
            taskId={task.id}
            projectId={task.projectId}
            workspaceId={task.workspaceId}
            tasks={task.children}
          />
        </div>
        <div className="flex flex-col gap-y-4">
          <TaskDescription task={task} />
          <TaskWorklog task={task} />
          <TaskAssets task={task} />
        </div>
      </div>
    </div>
  );
};
