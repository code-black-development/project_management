import DottedSeparator from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskWithUser } from "@/types/types";
import { PencilIcon, Tag } from "lucide-react";
import TaskOverviewProperty from "./task-overview-property";
import MemberAvatar from "@/features/members/_components/member-avatar";
import TaskDate from "./task-date";
import { TaskBadge } from "./task-badge";
import { snakeCaseToTitleCase } from "@/lib/utils";
import useEditTaskModal from "../hooks/use-edit-task-modal";
import TaskChildren from "./task-children";

import DynamicIcon from "@/components/dynamic-icon";

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
              name={
                (task.assignee?.user.name ?? task.assignee?.user.name) ||
                undefined
              }
              image={task.assignee?.user.image || undefined}
              className="size-6"
            />
            <p className="text-sm font-medium">
              {(task.assignee?.user.name ?? task.assignee?.user.email) ||
                "unassigned"}
            </p>
          </TaskOverviewProperty>
          <TaskOverviewProperty label="Created By">
            <MemberAvatar
              name={task.createdBy?.user.name || undefined}
              image={task.createdBy?.user.image || undefined}
              className="size-6"
            />
            <p className="text-sm font-medium">
              {task.createdBy?.user.name ||
                task.createdBy?.user.email ||
                "Unknown"}
            </p>
          </TaskOverviewProperty>
          <TaskOverviewProperty label="Due Date">
            {task.dueDate ? (
              <TaskDate value={task.dueDate} className="text-sm font-medium" />
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                No due date
              </span>
            )}
          </TaskOverviewProperty>
          <TaskOverviewProperty label="Status">
            <TaskBadge variant={task.status}>
              {snakeCaseToTitleCase(task.status)}
            </TaskBadge>
          </TaskOverviewProperty>

          <TaskOverviewProperty label="Category">
            {task.category ? (
              <Badge variant="outline" className="gap-x-2">
                <DynamicIcon
                  iconName={task.category.icon || "tag"}
                  className="size-4"
                />
                <p className="text-sm font-medium">{task.category.name}</p>
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-x-2">
                <p className="text-sm font-medium">-</p>
              </Badge>
            )}
          </TaskOverviewProperty>
        </div>
        <DottedSeparator className="my-4" />
        <TaskChildren
          taskId={task.id}
          projectId={task.projectId}
          workspaceId={task.workspaceId}
          tasks={task.children}
        />
      </div>
    </div>
  );
};

export default TaskOverview;
