"use client";

import { useEffect, useState } from "react";
import { TaskStatus, TaskType } from "@prisma/client";
import Link from "next/link";
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  TrashIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import DatePicker from "@/components/date-picker";
import DynamicIcon from "@/components/dynamic-icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MemberAvatar from "@/features/members/_components/member-avatar";
import ProjectAvatar from "@/features/projects/_components/project-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TaskDate from "./task-date";
import { cn, snakeCaseToTitleCase } from "@/lib/utils";
import { TaskWithUser } from "@/types/types";
import { useCloneTask } from "../api/use-clone-task";
import { useConfirm } from "@/hooks/use-confirm";
import { useDeleteEvent } from "../api/use-delete-event";
import { useDeleteTask } from "../api/use-delete-task";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useGetTaskCategories } from "../hooks/use-get-task-categories";
import { useRouter } from "next/navigation";
import { useUpdateTask } from "../api/use-update-task";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateSeriesModal from "./create-series-modal";
import PastDateWarning from "./past-date-warning";

interface TaskOverviewProps {
  task: TaskWithUser;
}

const UNASSIGNED_VALUE = "unassigned";
const NO_CATEGORY_VALUE = "no-category";

const statusOptions = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
];

const EditableRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="grid gap-y-1.5 sm:grid-cols-[94px_minmax(0,1fr)] sm:items-center sm:gap-x-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <div className="min-w-0">{children}</div>
  </div>
);

const StatusOption = ({
  status,
  isSelected,
  isPending,
  onSelect,
}: {
  status: TaskStatus;
  isSelected: boolean;
  isPending: boolean;
  onSelect: () => void;
}) => (
  <div
    role="button"
    className={cn(
      "flex min-h-9 cursor-pointer items-center gap-x-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors hover:bg-accent",
      isSelected
        ? "border-primary bg-primary/10 text-foreground"
        : "border-border bg-background text-muted-foreground",
      isPending && "pointer-events-none opacity-60"
    )}
    onClick={onSelect}
  >
    <Checkbox
      checked={isSelected}
      onCheckedChange={onSelect}
      onClick={(event) => event.stopPropagation()}
      disabled={isPending}
    />
    <span className="truncate">{snakeCaseToTitleCase(status)}</span>
  </div>
);

const TaskOverview = ({ task }: TaskOverviewProps) => {
  const workspaceId = useWorkspaceId();
  const { data: projects } = useGetProjects({ workspaceId });
  const { data: members } = useGetMembers({ workspaceId });
  const { data: categories } = useGetTaskCategories();
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const { mutate: cloneTask, isPending: isCloningTask } = useCloneTask();
  const { mutate: deleteTask, isPending: isDeletingTask } = useDeleteTask();
  const { mutate: deleteEvent, isPending: isDeletingEvent } = useDeleteEvent();
  const router = useRouter();
  const isEvent = task.taskType === TaskType.EVENT;
  const isDeleting = isDeletingTask || isDeletingEvent;
  const memberOptions = members?.data ?? [];

  const [name, setName] = useState(task.name);
  const [timeEstimate, setTimeEstimate] = useState(task.timeEstimate ?? "");
  const [seriesModalOpen, setSeriesModalOpen] = useState(false);

  useEffect(() => {
    setName(task.name);
    setTimeEstimate(task.timeEstimate ?? "");
  }, [task.name, task.timeEstimate]);

  const [ConfirmDialog, confirm] = useConfirm(
    isEvent ? "Delete Event" : "Delete Task",
    isEvent
      ? "This will permanently delete this event and all its occurrences. This action cannot be undone."
      : "This action cannot be undone.",
    "destructive"
  );


  const patchTask = (json: Parameters<typeof updateTask>[0]["json"]) => {
    updateTask({
      param: { taskId: task.id },
      json,
    });
  };

  const commitName = () => {
    const nextName = name.trim();
    if (!nextName) {
      setName(task.name);
      return;
    }

    if (nextName !== task.name) {
      patchTask({ name: nextName });
    }
  };

  const commitTimeEstimate = () => {
    const nextEstimate = timeEstimate.trim();
    if (nextEstimate !== (task.timeEstimate ?? "")) {
      patchTask({ timeEstimate: nextEstimate || null });
    }
  };

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
      <CreateSeriesModal
        taskId={task.id}
        taskName={task.name}
        taskDueDate={task.dueDate}
        open={seriesModalOpen}
        onClose={() => setSeriesModalOpen(false)}
      />
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <p className="text-sm font-semibold text-foreground">Overview</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="muted" className="h-7 px-2">
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:bg-card dark:text-foreground">
              <DropdownMenuItem
                onClick={() => cloneTask({ taskId: task.id })}
                disabled={isCloningTask}
              >
                <CopyIcon className="size-4 mr-2" />
                Clone task
              </DropdownMenuItem>
              {!isEvent && (
                <DropdownMenuItem onClick={() => setSeriesModalOpen(true)}>
                  <RefreshCwIcon className="size-4 mr-2" />
                  Create repeated task
                </DropdownMenuItem>
              )}
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

        <div className="flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-2">
            <p className="text-xs text-muted-foreground">Status</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {statusOptions.map((status) => (
                <StatusOption
                  key={status}
                  status={status}
                  isSelected={task.status === status}
                  isPending={isUpdating}
                  onSelect={() => {
                    if (task.status !== status) {
                      patchTask({ status });
                    }
                  }}
                />
              ))}
            </div>
          </div>

          <EditableRow label="Task name">
            <Textarea
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                event.target.style.height = "auto";
                event.target.style.height = `${event.target.scrollHeight}px`;
              }}
              onBlur={commitName}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
              }}
              disabled={isUpdating}
              rows={1}
              className="resize-none overflow-hidden min-h-0"
            />
          </EditableRow>

          <EditableRow label="Due date">
            <div className="space-y-2">
              <DatePicker
                value={task.dueDate ? new Date(task.dueDate) : undefined}
                onChange={(date) => patchTask({ dueDate: date })}
                placeholder="No due date"
                onClear={() => patchTask({ dueDate: null })}
              />
              <PastDateWarning
                date={task.dueDate}
                message="This due date is in the past. The task is overdue."
              />
            </div>
          </EditableRow>

          <EditableRow label="Assigned to">
            <Select
              value={task.assigneeId || UNASSIGNED_VALUE}
              onValueChange={(value) =>
                patchTask({
                  assigneeId: value === UNASSIGNED_VALUE ? null : value,
                })
              }
              disabled={isUpdating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED_VALUE}>
                  <span>Unassigned</span>
                </SelectItem>
                {memberOptions.map((member) => {
                  const memberName =
                    member.user.name || member.user.email || "Unnamed member";

                  return (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-x-2">
                        <MemberAvatar
                          name={memberName}
                          image={member.user.image || undefined}
                          className="size-5"
                          fallbackClassName="text-[10px]"
                        />
                        {memberName}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </EditableRow>

          <EditableRow label="Project">
            <Select
              value={task.projectId}
              onValueChange={(projectId) => patchTask({ projectId })}
              disabled={isUpdating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {(projects ?? []).map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-x-2">
                      <ProjectAvatar
                        className="size-5"
                        name={project.name}
                        image={project.image ?? undefined}
                      />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </EditableRow>

          <EditableRow label="Category">
            <Select
              value={task.categoryId || NO_CATEGORY_VALUE}
              onValueChange={(categoryId) =>
                patchTask({
                  categoryId:
                    categoryId === NO_CATEGORY_VALUE ? null : categoryId,
                })
              }
              disabled={isUpdating}
            >
              <SelectTrigger>
                <SelectValue placeholder="No category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY_VALUE}>No category</SelectItem>
                {(categories ?? []).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-x-2">
                      <DynamicIcon
                        iconName={category.icon || "tag"}
                        className="size-3.5 text-muted-foreground"
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </EditableRow>

          <EditableRow label="Estimate">
            <Input
              value={timeEstimate}
              onChange={(event) => setTimeEstimate(event.target.value)}
              onBlur={commitTimeEstimate}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              placeholder="2w 3d 4h 30m"
              disabled={isUpdating}
            />
          </EditableRow>

          <EditableRow label="Created by">
            <div className="flex items-center gap-x-2">
              <MemberAvatar
                name={task.createdBy?.user.name || undefined}
                image={task.createdBy?.user.image || undefined}
                className="size-5"
                fallbackClassName="text-[10px]"
              />
              <p className="truncate text-sm text-foreground">
                {task.createdBy?.user.name ??
                  task.createdBy?.user.email ??
                  "Unknown"}
              </p>
            </div>
          </EditableRow>

          {task.parent && (
            <EditableRow label="Parent task">
              <Link
                href={`/workspaces/${workspaceId}/tasks/${task.parent.id}`}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline transition-colors"
              >
                <ExternalLinkIcon className="size-3.5 shrink-0" />
                <span className="line-clamp-1">{task.parent.name}</span>
              </Link>
            </EditableRow>
          )}

          {isEvent && (
            <EditableRow label="Type">
              <span className="text-sm text-purple-500 dark:text-purple-400">
                Event
              </span>
            </EditableRow>
          )}

          {isEvent && task.isRecurring && (
            <>
              <EditableRow label="Recurrence">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-transparent"
                >
                  {task.recurrenceFrequency &&
                    snakeCaseToTitleCase(task.recurrenceFrequency)}
                </Badge>
              </EditableRow>
              <EditableRow label="Duration">
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-transparent"
                >
                  {task.recurrenceDuration &&
                    snakeCaseToTitleCase(task.recurrenceDuration)}
                </Badge>
              </EditableRow>
              {task.recurrenceEndDate && (
                <EditableRow label="Ends on">
                  <TaskDate value={task.recurrenceEndDate} className="text-sm" />
                </EditableRow>
              )}
            </>
          )}


          {isUpdating && (
            <div className="flex items-center gap-x-1.5 text-xs text-muted-foreground">
              <CheckIcon className="size-3.5" />
              Saving changes
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TaskOverview;
