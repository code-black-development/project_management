"use client";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { TaskWithUser } from "@/types/types";
import { TrashIcon } from "lucide-react";
import Link from "next/link";
import { useDeleteLinkedTask } from "../api/use-delete-linked-task";
import { useUpdateTask } from "../api/use-update-task";
import { TaskStatus } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskBadge } from "./task-badge";
import { snakeCaseToTitleCase } from "@/lib/utils";
import MemberAvatar from "@/features/members/_components/member-avatar";

interface TaskChildItemProps {
  task: TaskWithUser;
}

const STATUS_OPTIONS = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
];

const TaskChildItem = ({ task }: TaskChildItemProps) => {
  const workspaceId = useWorkspaceId();
  const { mutate: unlinkTask } = useDeleteLinkedTask();
  const { mutate: updateTask, isPending } = useUpdateTask();

  const handleUnlink = (e: React.MouseEvent) => {
    e.preventDefault();
    unlinkTask({ json: { childTask: task.id, parentId: task.parentId! } });
  };

  const handleStatusChange = (status: string) => {
    updateTask({ json: { status: status as TaskStatus }, param: { taskId: task.id } });
  };

  const assigneeName =
    task.assignee?.user.name || task.assignee?.user.email || null;

  return (
    <div className="flex items-center gap-x-2.5 px-3 py-2 rounded-lg border border-border hover:bg-accent transition-colors group">
      {/* Status select */}
      <Select
        value={task.status}
        onValueChange={handleStatusChange}
        disabled={isPending}
      >
        <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 shadow-none focus:ring-0 shrink-0 [&>svg]:hidden">
          <SelectValue>
            <TaskBadge variant={task.status} className="px-2 py-0 text-[11px] cursor-pointer">
              {snakeCaseToTitleCase(task.status)}
            </TaskBadge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>
              <TaskBadge variant={s} className="px-2 py-0 text-[11px]">
                {snakeCaseToTitleCase(s)}
              </TaskBadge>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Task name */}
      <Link
        href={`/workspaces/${workspaceId}/tasks/${task.id}`}
        className="flex-1 text-sm font-medium text-foreground truncate hover:text-primary transition-colors min-w-0"
      >
        {task.name}
      </Link>

      {/* Assignee */}
      {assigneeName ? (
        <div className="flex items-center gap-x-1.5 shrink-0">
          <MemberAvatar
            name={assigneeName}
            image={task.assignee?.user.image || undefined}
            className="size-5"
          />
          <span className="text-xs text-muted-foreground hidden sm:block max-w-[100px] truncate">
            {assigneeName}
          </span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground shrink-0">Unassigned</span>
      )}

      {/* Unlink */}
      <button
        onClick={handleUnlink}
        className="shrink-0 h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
        title="Unlink subtask"
      >
        <TrashIcon className="size-3.5" />
      </button>
    </div>
  );
};

export default TaskChildItem;
