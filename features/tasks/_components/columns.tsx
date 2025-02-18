"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Project, Task } from "@prisma/client";

type SafeTaskType = Omit<Task, "dueDate" | "createdAt" | "updatedAt"> & {
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  project:
    | (Omit<Project, "createdAt" | "updatedAt"> & {
        createdAt: string;
        updatedAt: string;
      })
    | null;
  assignee: User | null;
};
import { ArrowUpDown, MoreVertical } from "lucide-react";
import { User } from "next-auth";
import ProjectAvatar from "@/features/projects/_components/project-avatar";
import MemberAvatar from "@/features/members/_components/member-avatar";
import TaskDate from "./task-date";
import { snakeCaseToTitleCase } from "@/lib/utils";
import { TaskBadge } from "./task-badge";
import TaskActions from "./task-actions";

export const columns: ColumnDef<SafeTaskType>[] = [
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
      const assignee = row.original.assignee || {};
      return (
        <div className="flex items-center gap-x-2 text-sm">
          <MemberAvatar
            className="size-6"
            name={assignee.name || "Unassigned"}
            image={row.original.assignee?.image || undefined}
          />
          {assignee.name || "Unassigned"}
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
      return <TaskDate value={dueDate!} />;
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
      const status = row.original.status;
      return (
        <TaskBadge variant={status}>{snakeCaseToTitleCase(status)}</TaskBadge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const id = row.original.id;
      const projectId = row.original.projectId;
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
