import DottedSeparator from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import { TaskWithUser } from "@/types/types";
import { PencilIcon } from "lucide-react";
import TaskOverviewProperty from "./task-overview-property";
import MemberAvatar from "@/features/members/_components/member-avatar";
import TaskDate from "./task-date";
import { TaskBadge } from "./task-badge";
import { snakeCaseToTitleCase } from "@/lib/utils";
import useEditTaskModal from "../hooks/use-edit-task-modal";
import TaskChildren from "./task-children";

interface TaskOverviewProps {
  task: TaskWithUser;
}

const TaskOverview = ({ task }: TaskOverviewProps) => {
  const { open } = useEditTaskModal();

  return (
    <div className="flex flex-col gap-y-4 col-span-1">
      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Overview</p>
          <Button
            size="sm"
            variant="secondary"
            className=""
            onClick={() => open(task.id)}
          >
            <PencilIcon className="size-4 mr-2" />
            Edit
          </Button>
        </div>
        <DottedSeparator className="my-4" />
        <div className="flex flex-col gap-y-4">
          <TaskOverviewProperty label="Assignee">
            <MemberAvatar
              name={task.assignee?.user.name ?? undefined}
              className="size-6"
            />
            <p className="text-sm font-medium">
              {task.assignee?.user.name ?? "unassigned"}
            </p>
          </TaskOverviewProperty>
          <TaskOverviewProperty label="Due Date">
            <TaskDate value={task.dueDate} className="text-sm font-medium" />
          </TaskOverviewProperty>
          <TaskOverviewProperty label="Status">
            <TaskBadge variant={task.status}>
              {snakeCaseToTitleCase(task.status)}
            </TaskBadge>
          </TaskOverviewProperty>
        </div>
        <DottedSeparator className="my-4" />
        <TaskChildren
          taskId={task.id}
          projectId={task.projectId}
          tasks={task.children}
        />
      </div>
    </div>
  );
};

export default TaskOverview;
