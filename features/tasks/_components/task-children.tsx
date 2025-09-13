"use client";
import { TaskSafeDate } from "@/types/types";
import { useCreateLinkableTask } from "../api/use-create-linkable-task";
import { useGetLinkableTasks } from "../api/use-get-linkable-tasks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import TaskOverviewProperty from "./task-overview-property";
import DottedSeparator from "@/components/dotted-separator";
import TaskChildItem from "./task-child-item";
import { useCreateChildTaskModal } from "../contexts/create-child-task-modal-context";
import { PlusIcon } from "lucide-react";

interface TaskChildrenProps {
  taskId: string;
  projectId: string;
  workspaceId: string;
  tasks: TaskSafeDate[];
}
const TaskChildren = ({ taskId, projectId, workspaceId, tasks }: TaskChildrenProps) => {
  const { data: linkableTasks, isLoading: isLinkableTasksLoading } =
    useGetLinkableTasks({
      taskId,
      projectId,
    });

  const { mutate: linkTask, isPending: linkTaskIsPending } =
    useCreateLinkableTask();
    
  const { open: openCreateChildTaskModal } = useCreateChildTaskModal();

  const handleLinkTask = (childTaskId: string) => {
    linkTask({ json: { parentTask: taskId, childTask: childTaskId } });
  };

  const handleCreateChildTask = () => {
    console.log("Create child task button clicked", { taskId, projectId, workspaceId });
    openCreateChildTaskModal({
      taskId,
      projectId,
      workspaceId,
    });
    console.log("Modal opened");
  };

  if (isLinkableTasksLoading) {
    return null;
  }
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">Child Tickets</p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={handleCreateChildTask}
          >
            <PlusIcon className="size-4 mr-2" />
            Create Child Task
          </Button>
          {Array.isArray(linkableTasks) && linkableTasks.length > 0 ? (
            <Select onValueChange={(value) => handleLinkTask(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Link existing task" />
              </SelectTrigger>
              <SelectContent>
                {linkableTasks.map((linkableTask) => (
                  <SelectItem key={linkableTask.id} value={linkableTask.id}>
                    {linkableTask.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">No linkable tasks</p>
          )}
        </div>
      </div>
      {tasks && tasks.length > 0 ? (
        <div className="flex flex-col gap-y-4">
          <DottedSeparator className="my-4" />
          {tasks.map((child) => (
            <TaskChildItem task={child} key={child.id} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No child tasks</p>
      )}
    </>
  );
};

export default TaskChildren;
