import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { TaskStatus } from "@prisma/client";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        [TaskStatus.TODO]:
          "border-transparent bg-red-500/10 text-red-700 dark:text-red-400",
        [TaskStatus.IN_PROGRESS]:
          "border-transparent bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
        [TaskStatus.IN_REVIEW]:
          "border-transparent bg-blue-500/10 text-blue-700 dark:text-blue-400",
        [TaskStatus.DONE]:
          "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        [TaskStatus.BACKLOG]:
          "border-transparent bg-pink-500/10 text-pink-700 dark:text-pink-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function TaskBadge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { TaskBadge, badgeVariants };
