"use client";

import type { TaskStatus } from "@prisma/client";
import type { TaskListItem } from "@/types/types";
import DataKanban from "./data-kanban";

interface TaskKanbanViewProps {
  tasks: TaskListItem[];
  onChange: (
    tasks: { id: string; position: number; status: TaskStatus }[]
  ) => void;
}

const TaskKanbanView = ({ tasks, onChange }: TaskKanbanViewProps) => {
  return <DataKanban data={tasks} onChange={onChange} />;
};

export default TaskKanbanView;
