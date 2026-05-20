"use client";

import { TaskWithUser } from "@/types/types";
import { useGetTaskSeries } from "../api/use-get-task-series";
import { useDeleteTaskSeries } from "../api/use-delete-task-series";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useConfirm } from "@/hooks/use-confirm";
import { useRouter } from "next/navigation";
import { TaskBadge } from "./task-badge";
import { snakeCaseToTitleCase } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";
import { RecurrenceFrequency } from "@prisma/client";

interface TaskSeriesPanelProps {
  task: TaskWithUser;
}

const FREQUENCY_LABEL: Record<RecurrenceFrequency, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  FORTNIGHTLY: "Every 2 weeks",
  MONTHLY: "Monthly",
  ANNUALLY: "Annually",
};

const TaskSeriesPanel = ({ task }: TaskSeriesPanelProps) => {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const { data: seriesTasks, isLoading } = useGetTaskSeries(task.seriesId);
  const { mutate: deleteSeries, isPending: isDeletingSeries } = useDeleteTaskSeries();

  const [ConfirmDeleteAll, confirmDeleteAll] = useConfirm(
    "Delete entire series",
    "This will delete all tasks in this series, including past ones. This cannot be undone.",
    "destructive"
  );

  const [ConfirmDeleteUpcoming, confirmDeleteUpcoming] = useConfirm(
    "Delete this and upcoming tasks",
    "This will delete this task and all tasks in the series that come after it. Earlier tasks in the series will remain.",
    "destructive"
  );

  const handleDeleteAll = async () => {
    if (!task.seriesId) return;
    const ok = await confirmDeleteAll();
    if (!ok) return;
    deleteSeries(
      { seriesId: task.seriesId, scope: "all" },
      { onSuccess: () => router.push(`/workspaces/${workspaceId}/tasks`) }
    );
  };

  const handleDeleteUpcoming = async () => {
    if (!task.seriesId) return;
    const ok = await confirmDeleteUpcoming();
    if (!ok) return;
    deleteSeries(
      { seriesId: task.seriesId, scope: "upcoming", fromTaskId: task.id },
      { onSuccess: () => router.push(`/workspaces/${workspaceId}/tasks`) }
    );
  };

  return (
    <>
      <ConfirmDeleteAll />
      <ConfirmDeleteUpcoming />
      <div className="bg-card border border-border rounded-xl p-5">
        {/* Header */}
        <div className="flex items-center gap-x-2 border-b border-border pb-4 mb-4">
          <RefreshCwIcon className="size-3.5 text-muted-foreground shrink-0" />
          <p className="text-sm font-semibold text-foreground">Repeated task series</p>
        </div>

        {/* Series meta */}
        <div className="flex flex-col gap-y-2 mb-4">
          {task.recurrenceFrequency && (
            <div className="flex items-center gap-x-3">
              <p className="text-xs text-muted-foreground min-w-[72px]">Repeats</p>
              <span className="text-sm text-foreground">
                {FREQUENCY_LABEL[task.recurrenceFrequency]}
              </span>
            </div>
          )}
          {task.recurrenceEndDate && (
            <div className="flex items-center gap-x-3">
              <p className="text-xs text-muted-foreground min-w-[72px]">Ends on</p>
              <span className="text-sm text-foreground">
                {format(new Date(task.recurrenceEndDate), "MMM d, yyyy")}
              </span>
            </div>
          )}
          {seriesTasks && (
            <div className="flex items-center gap-x-3">
              <p className="text-xs text-muted-foreground min-w-[72px]">Tasks</p>
              <span className="text-sm text-foreground">{seriesTasks.length}</span>
            </div>
          )}
        </div>

        {/* Task list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : seriesTasks && seriesTasks.length > 0 ? (
          <div className="flex flex-col gap-y-1 mb-4 max-h-64 overflow-y-auto">
            {seriesTasks.map((t) => {
              const isCurrent = t.id === task.id;
              return (
                <Link
                  key={t.id}
                  href={`/workspaces/${workspaceId}/tasks/${t.id}`}
                  className={`flex items-center gap-x-2.5 px-2.5 py-2 rounded-lg border transition-colors ${
                    isCurrent
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <TaskBadge variant={t.status} className="px-2 py-0 text-[11px] shrink-0">
                    {snakeCaseToTitleCase(t.status)}
                  </TaskBadge>
                  <span
                    className={`flex-1 text-sm truncate ${
                      isCurrent ? "font-medium text-foreground" : "text-foreground"
                    }`}
                  >
                    {t.name}
                  </span>
                  {t.dueDate && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(t.dueDate), "MMM d")}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                      this
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ) : null}

        {/* Delete actions */}
        <div className="border-t border-border pt-4 flex items-center gap-x-2 flex-wrap gap-y-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isDeletingSeries}
            onClick={handleDeleteUpcoming}
            className="text-xs"
          >
            Delete this &amp; upcoming
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={isDeletingSeries}
            onClick={handleDeleteAll}
            className="text-xs"
          >
            Delete all
          </Button>
        </div>
      </div>
    </>
  );
};

export default TaskSeriesPanel;
