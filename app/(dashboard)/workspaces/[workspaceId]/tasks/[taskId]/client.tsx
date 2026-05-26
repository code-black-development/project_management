"use client";

import dynamic from "next/dynamic";
import PageError from "@/components/page-error";
import PageLoader from "@/components/page-loader";
import TaskBreadcrumbs from "@/features/tasks/_components/task-breadcrumbs";
import TaskOverview from "@/features/tasks/_components/task-overview";
import { useGetTask } from "@/features/tasks/api/use-get-task";
import { useTaskId } from "@/features/tasks/hooks/use-task-id";
import { TaskWithUser } from "@/types/types";

const TaskChildren = dynamic(
  () => import("@/features/tasks/_components/task-children"),
  { ssr: false, loading: () => <TaskPanelLoader /> }
);
const TaskDescription = dynamic(
  () => import("@/features/tasks/_components/task-description"),
  { ssr: false, loading: () => <TaskPanelLoader /> }
);
const TaskWorklog = dynamic(
  () => import("@/features/tasks/_components/task-worklog"),
  { ssr: false, loading: () => <TaskPanelLoader /> }
);
const TaskAssets = dynamic(
  () => import("@/features/tasks/_components/task-assets"),
  { ssr: false, loading: () => <TaskPanelLoader /> }
);
const TaskSeriesPanel = dynamic(
  () => import("@/features/tasks/_components/task-series-panel"),
  { ssr: false, loading: () => <TaskPanelLoader /> }
);

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
          <TaskWorklog task={task} />
          {task.seriesId && <TaskSeriesPanel task={task} />}
        </div>
        <div className="flex flex-col gap-y-4 min-w-0">
          <TaskDescription task={task} />
          <TaskChildren
            taskId={task.id}
            projectId={task.projectId}
            workspaceId={task.workspaceId}
            tasks={task.children}
          />
          <TaskAssets task={task} />
        </div>
      </div>
    </div>
  );
};

const TaskPanelLoader = () => (
  <div className="min-h-[120px] rounded-lg border border-border bg-card animate-pulse" />
);
