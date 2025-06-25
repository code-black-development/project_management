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
import TaskOverviewProperty from "./task-overview-property";
import DottedSeparator from "@/components/dotted-separator";
import TaskChildItem from "./task-child-item";

interface TaskChildrenProps {
  taskId: string;
  projectId: string;
  tasks: TaskSafeDate[];
}
const TaskChildren = ({ taskId, projectId, tasks }: TaskChildrenProps) => {
  const { data: linkableTasks, isLoading: isLinkableTasksLoading } =
    useGetLinkableTasks({
      taskId,
      projectId,
    });

  const { mutate: linkTask, isPending: linkTaskIsPending } =
    useCreateLinkableTask();
  const handleLinkTask = (childTaskId: string) => {
    linkTask({ json: { parentTask: taskId, childTask: childTaskId } });
  };

  if (isLinkableTasksLoading) {
    return null;
  }
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">Child Tickets</p>
        {Array.isArray(linkableTasks) && linkableTasks.length > 0 ? (
          <Select onValueChange={(value) => handleLinkTask(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a task" />
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
          <p>No linkable tasks</p>
        )}
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
