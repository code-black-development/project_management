"use client";

import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { TaskStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, MoreVertical } from "lucide-react";
import ProjectAvatar from "@/features/projects/_components/project-avatar";
import MemberAvatar from "@/features/members/_components/member-avatar";
import TaskDate from "./task-date";
import { snakeCaseToTitleCase } from "@/lib/utils";
import { TaskBadge } from "./task-badge";
import TaskActions from "./task-actions";
import { TaskListItem } from "@/types/types";
import DynamicIcon from "@/components/dynamic-icon";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateTask } from "../api/use-update-task";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetTaskCategories } from "../hooks/use-get-task-categories";

const STATUS_OPTIONS = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
];

const StatusCell = ({ task }: { task: TaskListItem }) => {
  const { mutate: updateTask, isPending } = useUpdateTask();

  const handleChange = (status: string) => {
    updateTask({ param: { taskId: task.id }, json: { status: status as TaskStatus } });
  };

  return (
    <Select value={task.status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:hidden">
        <SelectValue>
          <TaskBadge variant={task.status} className="cursor-pointer">
            {snakeCaseToTitleCase(task.status)}
          </TaskBadge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((s) => (
          <SelectItem key={s} value={s}>
            <TaskBadge variant={s}>{snakeCaseToTitleCase(s)}</TaskBadge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const AssigneeCell = ({ task }: { task: TaskListItem }) => {
  const { mutate: updateTask, isPending } = useUpdateTask();
  const { data: membersData } = useGetMembers({ workspaceId: task.workspaceId });
  const members = membersData?.data ?? [];

  const handleChange = (value: string) => {
    updateTask({
      param: { taskId: task.id },
      json: { assigneeId: value === "unassigned" ? null : value },
    });
  };

  const currentName =
    (task.assignee?.user?.name ?? task.assignee?.user?.email) || "Unassigned";

  return (
    <Select
      value={task.assignee?.id ?? "unassigned"}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:hidden">
        <SelectValue>
          <div className="flex items-center gap-x-2 text-sm">
            <MemberAvatar
              className="size-6"
              name={currentName}
              image={task.assignee?.user?.image || undefined}
            />
            {currentName}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">
          <span className="text-muted-foreground">Unassigned</span>
        </SelectItem>
        {members.map((member) => (
          <SelectItem key={member.id} value={member.id}>
            {member.user.name || member.user.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const CategoryCell = ({ task }: { task: TaskListItem }) => {
  const { mutate: updateTask, isPending } = useUpdateTask();
  const { data: categories } = useGetTaskCategories();

  const handleChange = (value: string) => {
    updateTask({
      param: { taskId: task.id },
      json: { categoryId: value === "none" ? null : value },
    });
  };

  const currentCategory = task.category;

  return (
    <Select
      value={currentCategory?.id ?? "none"}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:hidden">
        <SelectValue>
          {currentCategory ? (
            <div className="flex items-center gap-x-2">
              <DynamicIcon
                iconName={currentCategory.icon || "tag"}
                className="size-4 text-muted-foreground"
              />
              <Badge variant="secondary" className="text-xs">
                {currentCategory.name}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">No category</span>
        </SelectItem>
        {categories?.map((cat) => (
          <SelectItem key={cat.id} value={cat.id}>
            <div className="flex items-center gap-x-2">
              <DynamicIcon
                iconName={cat.icon || "tag"}
                className="size-4 text-muted-foreground"
              />
              {cat.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const columns: ColumnDef<TaskListItem>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
      const taskId = row.original.id;
      const workspaceId = row.original.workspaceId;
      
      return (
        <Link 
          href={`/workspaces/${workspaceId}/tasks/${taskId}`}
          className="line-clamp-1 hover:underline hover:text-primary transition-colors cursor-pointer"
        >
          {name}
        </Link>
      );
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
    cell: ({ row }) => <AssigneeCell task={row.original} />,
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
    cell: ({ row }) => <CategoryCell task={row.original} />,
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
    cell: ({ row }) => <StatusCell task={row.original} />,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), "MMM d, yyyy")}
        </span>
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
