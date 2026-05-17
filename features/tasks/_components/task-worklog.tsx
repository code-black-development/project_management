"use client";

import { Button } from "@/components/ui/button";
import { TaskWithUser } from "@/types/types";
import { PlusIcon, ChevronDownIcon, ChevronRightIcon, EditIcon, TimerIcon } from "lucide-react";
import useCreateTaskWorklogModal from "../hooks/use-create-task-worklog-modal";
import {
  timeEstimateStringToMinutes,
  minutesToTimeEstimateString,
} from "@/lib/utils";
import ProgressBar from "@/components/progress-bar";
import MemberAvatar from "@/features/members/_components/member-avatar";
import { useState } from "react";
import { useSession } from "next-auth/react";

interface TaskWorklogProps {
  task: TaskWithUser;
}

const TaskWorklog = ({ task }: TaskWorklogProps) => {
  const { open, openEdit } = useCreateTaskWorklogModal();
  const { data: session } = useSession();
  const [expandedWorklogs, setExpandedWorklogs] = useState<Set<string>>(new Set());

  const estimateInMinutes = task.timeEstimate
    ? timeEstimateStringToMinutes(task.timeEstimate)
    : 0;

  const worklogTotal = task.worklogs.reduce((sum, w) => sum + w.timeSpent, 0);

  const progressValue =
    estimateInMinutes > 0
      ? Math.round((worklogTotal / estimateInMinutes) * 100)
      : 0;

  const hasEstimate = estimateInMinutes > 0;
  const hasWorklogs = task.worklogs.length > 0;
  const hasData = hasEstimate || hasWorklogs;

  const toggleWorklogExpansion = (worklogId: string) => {
    setExpandedWorklogs((prev) => {
      const next = new Set(prev);
      next.has(worklogId) ? next.delete(worklogId) : next.add(worklogId);
      return next;
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
        <p className="text-sm font-semibold text-foreground">Worklogs</p>
        <Button size="sm" variant="muted" onClick={() => open(task.id)}>
          <PlusIcon className="size-3.5 mr-1.5" />
          Add worklog
        </Button>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-y-1.5 py-6 text-center">
          <TimerIcon className="size-7 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No time logged yet</p>
          <p className="text-xs text-muted-foreground/70">
            Track time against this task to measure progress.
          </p>
        </div>
      ) : (
        <>
          {/* Time summary */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex flex-col gap-y-0.5">
              <p className="text-xs text-muted-foreground">Estimated</p>
              <p className="text-sm font-medium text-foreground">
                {hasEstimate ? task.timeEstimate : <span className="text-muted-foreground">No estimate</span>}
              </p>
            </div>
            <div className="flex flex-col gap-y-0.5 text-right">
              <p className="text-xs text-muted-foreground">Logged</p>
              <p className="text-sm font-medium text-foreground">
                {hasWorklogs ? minutesToTimeEstimateString(worklogTotal) : "0h"}
              </p>
            </div>
          </div>

          {/* Progress bar — only when meaningful */}
          {hasEstimate && hasWorklogs && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span className="text-xs text-muted-foreground">{progressValue}%</span>
              </div>
              <ProgressBar progress={progressValue} />
            </div>
          )}

          {/* Worklog entries */}
          {hasWorklogs && (
            <div className="space-y-2">
              {task.worklogs.map((worklog) => {
                const isExpanded = expandedWorklogs.has(worklog.id);
                const hasDescription =
                  worklog.workDescription && worklog.workDescription.trim().length > 0;
                const canEdit = worklog.member?.user?.id === session?.user?.id;

                return (
                  <div key={worklog.id} className="border border-border rounded-lg overflow-hidden">
                    <div
                      className={`flex items-center justify-between p-2.5 bg-muted ${
                        hasDescription ? "cursor-pointer hover:bg-accent transition-colors" : ""
                      }`}
                    >
                      <div
                        className="flex items-center gap-2 flex-1"
                        onClick={() => hasDescription && toggleWorklogExpansion(worklog.id)}
                      >
                        {hasDescription && (
                          <div className="shrink-0 text-muted-foreground">
                            {isExpanded ? (
                              <ChevronDownIcon className="size-3.5" />
                            ) : (
                              <ChevronRightIcon className="size-3.5" />
                            )}
                          </div>
                        )}
                        <MemberAvatar
                          name={worklog.member?.user?.name ?? worklog.member?.user?.email ?? "Unknown"}
                          image={worklog.member?.user?.image || undefined}
                          className="size-5"
                          fallbackClassName="text-[10px]"
                        />
                        <span className="text-sm text-foreground">
                          {worklog.member?.user?.name ?? worklog.member?.user?.email ?? "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {minutesToTimeEstimateString(worklog.timeSpent)}
                        </span>
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(task.id, worklog.id);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <EditIcon className="size-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {hasDescription && isExpanded && (
                      <div className="px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                          {worklog.workDescription}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskWorklog;
