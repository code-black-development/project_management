"use client";

import DottedSeparator from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import { TaskWithUser } from "@/types/types";
import { PlusIcon, ChevronDownIcon, ChevronRightIcon, EditIcon } from "lucide-react";
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

  let worklogTotal = 0;
  if (task.worklogs.length > 0) {
    task.worklogs.map((worklog) => {
      worklogTotal += worklog.timeSpent;
    });
  }
  const progressValue =
    estimateInMinutes > 0
      ? Math.round((worklogTotal / estimateInMinutes) * 100)
      : 0;

  const toggleWorklogExpansion = (worklogId: string) => {
    const newExpanded = new Set(expandedWorklogs);
    if (newExpanded.has(worklogId)) {
      newExpanded.delete(worklogId);
    } else {
      newExpanded.add(worklogId);
    }
    setExpandedWorklogs(newExpanded);
  };

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <p className="tetx-lg font-semibold">Worklogs</p>
        <Button size="sm" variant="secondary" onClick={() => open(task.id)}>
          <PlusIcon className="size-4 mr-2" />
        </Button>
      </div>
      <DottedSeparator className="my-4" />
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col  justify-between">
          <p className="font-medium">Original Estimated Time:</p>
          {task.timeEstimate || <span>--</span>}
        </div>
        <div className="flex flex-col">
          <p className="font-medium">Total Time Logged:</p>
          {minutesToTimeEstimateString(worklogTotal)}
        </div>
      </div>
      <div className="flex flex-col gap-8 pt-4 my-4">
        <p>Task Progress</p>
        <ProgressBar progress={progressValue} />
      </div>

      {/* Worklog List */}
      {task.worklogs.length > 0 && (
        <>
          <DottedSeparator className="my-4" />
          <div className="space-y-3">
            <p className="font-medium text-sm">Logged Time Entries:</p>
            <div className="space-y-2">
              {task.worklogs.map((worklog) => {
                const isExpanded = expandedWorklogs.has(worklog.id);
                const hasDescription = worklog.workDescription && worklog.workDescription.trim().length > 0;
                const canEdit = worklog.member?.user?.id === session?.user?.id;
                
                return (
                  <div key={worklog.id} className="border rounded-md">
                    <div
                      className={`flex items-center justify-between p-2 bg-muted rounded-md ${
                        hasDescription ? 'cursor-pointer hover:bg-muted/80' : ''
                      }`}
                    >
                      <div 
                        className="flex items-center gap-2 flex-1"
                        onClick={() => hasDescription && toggleWorklogExpansion(worklog.id)}
                      >
                        {hasDescription && (
                          <div className="flex-shrink-0">
                            {isExpanded ? (
                              <ChevronDownIcon className="size-4 text-muted-foreground" />
                            ) : (
                              <ChevronRightIcon className="size-4 text-muted-foreground" />
                            )}
                          </div>
                        )}
                        <MemberAvatar
                          name={
                            worklog.member?.user?.name ||
                            worklog.member?.user?.email ||
                            "Unknown"
                          }
                          image={worklog.member?.user?.image || undefined}
                          className="size-6"
                          fallbackClassName="text-xs"
                        />
                        <span className="text-sm">
                          {worklog.member?.user?.name ||
                            worklog.member?.user?.email ||
                            "Unknown User"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
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
                      <div className="px-4 pb-3 pt-1">
                        <div className="text-sm text-muted-foreground bg-background p-2 rounded border-l-2 border-primary/20">
                          {worklog.workDescription}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TaskWorklog;
