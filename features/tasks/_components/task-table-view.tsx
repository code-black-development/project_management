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
  hideAssigneeColumn?: boolean;
}

const TaskTableView = ({ tasks, onDeleteSelected, onUpdateStatusSelected, hideProjectColumn, hideAssigneeColumn }: TaskTableViewProps) => {
  const visibleColumns = columns.filter((col) => {
    const key = (col as any).accessorKey;
    if (hideProjectColumn && key === "project") return false;
    if (hideAssigneeColumn && key === "assignee") return false;
    return true;
  });

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
