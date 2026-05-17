"use client";

import ProjectAvatar from "@/features/projects/_components/project-avatar";
import { ProjectSafeDate, TaskWithUser } from "@/types/types";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { TaskBadge } from "./task-badge";
import { snakeCaseToTitleCase } from "@/lib/utils";
import TaskDate from "./task-date";
import MemberAvatar from "@/features/members/_components/member-avatar";
import { TaskType } from "@prisma/client";

interface TaskBreadcrumbsProps {
  project: ProjectSafeDate;
  task: TaskWithUser;
}

const TaskBreadcrumbs = ({ project, task }: TaskBreadcrumbsProps) => {
  const isEvent = task.taskType === TaskType.EVENT;

  return (
    <div className="flex flex-col gap-y-2">
      {/* Breadcrumb */}
      <div className="flex items-center gap-x-1.5 text-sm text-muted-foreground">
        <Link
          href={`/workspaces/${project.workspaceId}/tasks`}
          className="hover:text-foreground transition-colors"
        >
          Tasks
        </Link>
        <ChevronRightIcon className="size-3.5 shrink-0" />
        <div className="flex items-center gap-x-1.5 min-w-0">
          <ProjectAvatar
            image={project.image ?? undefined}
            name={project.name}
            className="size-4 shrink-0"
            fallbackClassName="text-[8px]"
          />
          <Link
            href={`/workspaces/${project.workspaceId}/projects/${project.id}`}
            className="hover:text-foreground transition-colors truncate"
          >
            {project.name}
          </Link>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-foreground leading-snug">
        {task.name}
      </h1>

      {/* Metadata line */}
      <div className="flex items-center gap-x-2.5 flex-wrap text-sm text-muted-foreground">
        <TaskBadge variant={task.status}>
          {snakeCaseToTitleCase(task.status)}
        </TaskBadge>
        <span>·</span>
        {task.dueDate ? (
          <TaskDate value={task.dueDate} className="text-sm" />
        ) : (
          <span>No due date</span>
        )}
        {task.assignee && (
          <>
            <span>·</span>
            <div className="flex items-center gap-x-1.5">
              <MemberAvatar
                name={task.assignee.user.name ?? task.assignee.user.email}
                image={task.assignee.user.image || undefined}
                className="size-4"
                fallbackClassName="text-[8px]"
              />
              <span>{task.assignee.user.name ?? task.assignee.user.email}</span>
            </div>
          </>
        )}
        {isEvent && (
          <>
            <span>·</span>
            <span className="text-purple-500 dark:text-purple-400">Event</span>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskBreadcrumbs;
