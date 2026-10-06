import { TaskPriority } from "@prisma/client";

export const TASK_PRIORITIES = Object.values(TaskPriority) as TaskPriority[];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const PRIORITY_BADGE_CLASSES: Record<TaskPriority, string> = {
  HIGH: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  MEDIUM: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  LOW: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
};
