"use client";

import { TaskWithUser } from "@/types/types";
import TaskOverviewProperty from "./task-overview-property";
import MemberAvatar from "@/features/members/_components/member-avatar";
import TaskDate from "./task-date";
import { snakeCaseToTitleCase } from "@/lib/utils";
import { TaskType } from "@prisma/client";
import Link from "next/link";
import { ExternalLinkIcon, PencilIcon, MoreHorizontalIcon, TrashIcon, CopyIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DynamicIcon from "@/components/dynamic-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import useEditTaskModal from "../hooks/use-edit-task-modal";
import { useCloneTask } from "../api/use-clone-task";
import { useDeleteTask } from "../api/use-delete-task";
import { useDeleteEvent } from "../api/use-delete-event";
import { useConfirm } from "@/hooks/use-confirm";
import { useRouter } from "next/navigation";

interface TaskOverviewProps {
  task: TaskWithUser;
}

const TaskOverview = ({ task }: TaskOverviewProps) => {
  const workspaceId = useWorkspaceId();
  const { open: openEdit } = useEditTaskModal();
  const { mutate: cloneTask, isPending: isCloningTask } = useCloneTask();
  const { mutate: deleteTask, isPending: isDeletingTask } = useDeleteTask();
  const { mutate: deleteEvent, isPending: isDeletingEvent } = useDeleteEvent();
  const router = useRouter();
  const isEvent = task.taskType === TaskType.EVENT;
  const isDeleting = isDeletingTask || isDeletingEvent;

  const [ConfirmDialog, confirm] = useConfirm(
    isEvent ? "Delete Event" : "Delete Task",
    isEvent
      ? "This will permanently delete this event and all its occurrences. This action cannot be undone."
      : "This action cannot be undone.",
    "destructive"
  );

  const handleDelete = async () => {
    const ok = await confirm();
    if (!ok) return;
    if (isEvent) {
      deleteEvent(
        { param: { eventId: task.id } },
        { onSuccess: () => router.push(`/workspaces/${workspaceId}/tasks`) }
      );
    } else {
      deleteTask(
        { param: { taskId: task.id } },
        { onSuccess: () => router.push(`/workspaces/${workspaceId}/tasks`) }
      );
    }
  };

  return (
    <>
      <ConfirmDialog />
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <p className="text-sm font-semibold text-foreground">Overview</p>
          <div className="flex items-center gap-x-1">
            <Button size="sm" variant="muted" className="h-7 px-2.5" onClick={() => openEdit(task.id)}>
              <PencilIcon className="size-3.5 mr-1.5" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="muted" className="h-7 px-2">
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => cloneTask({ taskId: task.id })}
                  disabled={isCloningTask}
                >
                  <CopyIcon className="size-4 mr-2" />
                  Clone task
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive focus:text-destructive"
                >
                  <TrashIcon className="size-4 mr-2" />
                  {isEvent ? "Delete event" : "Delete task"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-col gap-y-3">
          <TaskOverviewProperty label="Created by">
            <MemberAvatar
              name={task.createdBy?.user.name || undefined}
              image={task.createdBy?.user.image || undefined}
              className="size-5"
              fallbackClassName="text-[10px]"
            />
            <p className="text-sm text-foreground">
              {task.createdBy?.user.name ?? task.createdBy?.user.email ?? "Unknown"}
            </p>
          </TaskOverviewProperty>

          {task.parent && (
            <TaskOverviewProperty label="Parent task">
              <Link
                href={`/workspaces/${workspaceId}/tasks/${task.parent.id}`}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline transition-colors"
              >
                <ExternalLinkIcon className="size-3.5 shrink-0" />
                <span className="line-clamp-1">{task.parent.name}</span>
              </Link>
            </TaskOverviewProperty>
          )}

          {task.category && (
            <TaskOverviewProperty label="Category">
              <div className="flex items-center gap-x-1.5">
                <DynamicIcon
                  iconName={task.category.icon || "tag"}
                  className="size-3.5 text-muted-foreground"
                />
                <span className="text-sm text-foreground">{task.category.name}</span>
              </div>
            </TaskOverviewProperty>
          )}

          {isEvent && (
            <TaskOverviewProperty label="Type">
              <span className="text-sm text-purple-500 dark:text-purple-400">Event</span>
            </TaskOverviewProperty>
          )}

          {isEvent && task.isRecurring && (
            <>
              <TaskOverviewProperty label="Recurrence">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-transparent">
                  {task.recurrenceFrequency && snakeCaseToTitleCase(task.recurrenceFrequency)}
                </Badge>
              </TaskOverviewProperty>
              <TaskOverviewProperty label="Duration">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-transparent">
                  {task.recurrenceDuration && snakeCaseToTitleCase(task.recurrenceDuration)}
                </Badge>
              </TaskOverviewProperty>
              {task.recurrenceEndDate && (
                <TaskOverviewProperty label="Ends on">
                  <TaskDate value={task.recurrenceEndDate} className="text-sm" />
                </TaskOverviewProperty>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TaskOverview;
