import { Task } from "@prisma/client";
import TaskActions from "./task-actions";
import { MoreHorizontal } from "lucide-react";
import DottedSeparator from "@/components/dotted-separator";
import MemberAvatar from "@/features/members/_components/member-avatar";
import { TaskWithUser } from "@/types/types";
import TaskDate from "./task-date";
import ProjectAvatar from "@/features/projects/_components/project-avatar";

interface DataKanbanCardProps {
  task: Omit<TaskWithUser, "children">;
}

const DataKanbanCard = ({ task }: DataKanbanCardProps) => {
  return (
    <div className="p-2.5 mb-1.5 rounded shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-x-2">
        <p className="text-sm line-clamp-2">{task.name}</p>
        <TaskActions id={task.id} projectId={task.projectId}>
          <MoreHorizontal className="size-[18px] stroke-1 shrink-0  text-neutral-700 opacity-75 transition cursor-pointer" />
        </TaskActions>
      </div>
      <DottedSeparator />
      <div className="flex items-center gap-x-1.5">
        <MemberAvatar
          name={
            (task.assignee?.user?.name ?? task.assignee?.user.email) ||
            "unassigned"
          }
          fallbackClassName="text-[10px]"
        />
        <div className="size-1 rounded-full bg-neutral-300" />
        <TaskDate value={task.dueDate!} className="text-xs" />
      </div>
      <div className="flex items-center gap-x-1.5 ">
        <ProjectAvatar
          name={task.project.name || "unassigned"}
          image={task.project.image || undefined}
          fallbackClassName="text-[10px]"
        />
        <span>{task.project.name}</span>
      </div>
    </div>
  );
};

export default DataKanbanCard;
