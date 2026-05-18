"use client";

import { DataTable } from "./data-table";
import { columns } from "./columns";
import type { TaskListItem } from "@/types/types";

interface TaskTableViewProps {
  tasks: TaskListItem[];
  onDeleteSelected: (ids: string[]) => void;
  hideProjectColumn?: boolean;
}

const TaskTableView = ({ tasks, onDeleteSelected, hideProjectColumn }: TaskTableViewProps) => {
  const visibleColumns = hideProjectColumn
    ? columns.filter((col) => (col as any).accessorKey !== "project")
    : columns;

  return (
    <DataTable
      columns={visibleColumns}
      data={tasks}
      onDeleteSelected={onDeleteSelected}
    />
  );
};

export default TaskTableView;
