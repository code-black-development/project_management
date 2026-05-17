import TaskActions from "./task-actions";
import { MoreHorizontal, CalendarIcon } from "lucide-react";
import MemberAvatar from "@/features/members/_components/member-avatar";
import { TaskWithUser } from "@/types/types";
import ProjectAvatar from "@/features/projects/_components/project-avatar";
import DynamicIcon from "@/components/dynamic-icon";
import Link from "next/link";
import { differenceInDays, format } from "date-fns";
import { cn } from "@/lib/utils";

interface DataKanbanCardProps {
  task: Omit<TaskWithUser, "children">;
}

const getDueDateStyle = (dateStr: string) => {
  const diff = differenceInDays(new Date(dateStr), new Date());
  if (diff < 0)   return "text-rose-500 dark:text-rose-400";
  if (diff <= 3)  return "text-rose-400 dark:text-rose-400/80";
  if (diff <= 7)  return "text-amber-500 dark:text-amber-400";
  return "text-muted-foreground";
};

const DataKanbanCard = ({ task }: DataKanbanCardProps) => {
  const assigneeName =
    task.assignee?.user?.name ?? task.assignee?.user?.email ?? "Unassigned";

  return (
    <div className="p-3 flex flex-col gap-y-2.5">
      {/* Title + hover menu */}
      <div className="flex items-start justify-between gap-x-2">
        <Link
          href={`/workspaces/${task.workspaceId}/tasks/${task.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-medium text-foreground leading-snug line-clamp-3 hover:text-primary transition-colors"
        >
          {task.name}
        </Link>
        <TaskActions id={task.id} projectId={task.projectId}>
          <MoreHorizontal className="size-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-foreground transition-opacity cursor-pointer" />
        </TaskActions>
      </div>

      {/* Category — only if set */}
      {task.category && (
        <div className="flex items-center gap-x-1.5">
          <DynamicIcon
            iconName={task.category.icon || "tag"}
            className="size-3 text-muted-foreground shrink-0"
          />
          <span className="text-xs text-muted-foreground truncate">
            {task.category.name}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col gap-y-1.5 pt-2.5 border-t border-border/30 dark:border-white/[0.06]">
        {/* Assignee + due date */}
        <div className="flex items-center justify-between gap-x-2">
          <div className="flex items-center gap-x-1.5 min-w-0">
            <MemberAvatar
              name={assigneeName}
              image={task.assignee?.user?.image || undefined}
              className="size-5 shrink-0"
              fallbackClassName="text-[9px]"
            />
            <span className="text-xs text-muted-foreground truncate">
              {assigneeName}
            </span>
          </div>
          {task.dueDate && (
            <div className={cn("flex items-center gap-x-1 shrink-0 text-xs", getDueDateStyle(task.dueDate))}>
              <CalendarIcon className="size-3" />
              <span>{format(new Date(task.dueDate), "MMM d")}</span>
            </div>
          )}
        </div>

        {/* Project */}
        <div className="flex items-center gap-x-1.5">
          <ProjectAvatar
            name={task.project.name}
            image={task.project.image || undefined}
            className="size-3.5 shrink-0"
            fallbackClassName="text-[8px]"
          />
          <span className="text-xs text-muted-foreground/70 truncate">
            {task.project.name}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DataKanbanCard;
