"use client";

import { DataTable } from "./data-table";
import { columns } from "./columns";
import type { TaskListItem } from "@/types/types";

interface TaskTableViewProps {
  tasks: TaskListItem[];
  onDeleteSelected: (ids: string[]) => void;
}

const TaskTableView = ({ tasks, onDeleteSelected }: TaskTableViewProps) => {
  return (
    <DataTable
      columns={columns}
      data={tasks}
      onDeleteSelected={onDeleteSelected}
    />
  );
};

export default TaskTableView;
