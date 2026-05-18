"use client";

import { DataTable } from "./data-table";
import { columns } from "./columns";
import type { TaskListItem } from "@/types/types";
import { TaskStatus } from "@prisma/client";

interface TaskTableViewProps {
  tasks: TaskListItem[];
  onDeleteSelected: (ids: string[]) => void;
  onUpdateStatusSelected: (ids: string[], status: TaskStatus) => void;
  hideProjectColumn?: boolean;
}

const TaskTableView = ({ tasks, onDeleteSelected, onUpdateStatusSelected, hideProjectColumn }: TaskTableViewProps) => {
  const visibleColumns = hideProjectColumn
    ? columns.filter((col) => (col as any).accessorKey !== "project")
    : columns;

  return (
    <DataTable
      columns={visibleColumns}
      data={tasks}
      onDeleteSelected={onDeleteSelected}
      onUpdateStatusSelected={onUpdateStatusSelected}
    />
  );
};

export default TaskTableView;
