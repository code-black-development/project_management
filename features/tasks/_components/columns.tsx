"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreVertical } from "lucide-react";
import ProjectAvatar from "@/features/projects/_components/project-avatar";
import MemberAvatar from "@/features/members/_components/member-avatar";
import TaskDate from "./task-date";
import { snakeCaseToTitleCase } from "@/lib/utils";
import { TaskBadge } from "./task-badge";
import TaskActions from "./task-actions";
import { TaskWithUser } from "@/types/types";
import DynamicIcon from "@/components/dynamic-icon";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<Omit<TaskWithUser, "children">>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Task Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.original.name;
      return <p className="line-clamp-1">{name}</p>;
    },
  },
  {
    accessorKey: "project",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Project Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.original.project?.name;
      return (
        <div className="flex items-center gap-x-2 text-sm">
          <ProjectAvatar
            className="size-6"
            name={name!}
            image={row.original.project?.image || undefined}
          />
          {name}
        </div>
      );
    },
  },
  {
    accessorKey: "assignee",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Assigned to
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-x-2 text-sm">
          <MemberAvatar
            className="size-6"
            name={
              (row.original.assignee?.user?.name ??
                row.original.assignee?.user?.email) ||
              "Unassigned"
            }
            image={row.original.assignee?.user?.image || undefined}
          />
          {(row.original.assignee?.user.name ??
            row.original.assignee?.user.email) ||
            "Unassigned"}
        </div>
      );
    },
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          //className="flex items-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Due date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const dueDate = row.original.dueDate;
      if (!dueDate) {
        return (
          <span className="text-muted-foreground text-sm">No due date</span>
        );
      }
      return <TaskDate value={dueDate} />;
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const category = row.original.category;
      if (!category) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <div className="flex items-center gap-x-2">
          <DynamicIcon
            iconName={category.icon || "tag"}
            className="size-4 text-muted-foreground"
          />
          <Badge variant="secondary" className="text-xs">
            {category.name}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          //className="flex items-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.original.status!;
      return (
        <TaskBadge variant={status}>{snakeCaseToTitleCase(status)}</TaskBadge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const id = row.original.id as string;
      const projectId = row.original.projectId as string;
      return (
        <TaskActions id={id} projectId={projectId}>
          <Button variant="ghost" className="size-8 p-0">
            <MoreVertical className="size-4" />
          </Button>
        </TaskActions>
      );
    },
  },
];
