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
import TaskChildItem from "./task-child-item";
import useCreateChildTaskModal from "../hooks/use-create-child-task-modal";
import { PlusIcon, LinkIcon, GitBranchIcon } from "lucide-react";

interface TaskChildrenProps {
  taskId: string;
  projectId: string;
  workspaceId: string;
  tasks: TaskSafeDate[];
}

const TaskChildren = ({
  taskId,
  projectId,
  workspaceId,
  tasks,
}: TaskChildrenProps) => {
  const { data: linkableTasks, isLoading: isLinkableTasksLoading } =
    useGetLinkableTasks({ taskId, projectId });

  const { mutate: linkTask, isPending: linkTaskIsPending } =
    useCreateLinkableTask();

  const { open: openCreateChildTaskModal } = useCreateChildTaskModal();

  const handleLinkTask = (childTaskId: string) => {
    linkTask({ json: { parentTask: taskId, childTask: childTaskId } });
  };

  const handleCreateSubtask = () => {
    openCreateChildTaskModal({ taskId, projectId, workspaceId });
  };

  if (isLinkableTasksLoading) return null;

  const hasSubtasks = tasks && tasks.length > 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
        <p className="text-sm font-semibold text-foreground">
          Subtasks
          {hasSubtasks && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              {tasks.length}
            </span>
          )}
        </p>
        <div className="flex items-center gap-x-1">
          <Button
            size="sm"
            variant="muted"
            className="h-7 px-2"
            onClick={handleCreateSubtask}
            title="Create subtask"
          >
            <PlusIcon className="size-3.5" />
          </Button>
          {Array.isArray(linkableTasks) && linkableTasks.length > 0 && (
            <Select onValueChange={(value) => handleLinkTask(value)}>
              <SelectTrigger className="h-7 px-2 w-auto border-0 bg-neutral-200 dark:bg-muted dark:border dark:border-border text-muted-foreground hover:bg-neutral-200/80 dark:hover:bg-accent" title="Link existing task">
                <LinkIcon className="size-3.5" />
              </SelectTrigger>
              <SelectContent>
                {linkableTasks.map((linkableTask) => (
                  <SelectItem key={linkableTask.id} value={linkableTask.id}>
                    {linkableTask.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {hasSubtasks ? (
        <div className="flex flex-col gap-y-2">
          {tasks.map((child) => (
            <TaskChildItem task={child} key={child.id} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-y-1.5 py-6 text-center">
          <GitBranchIcon className="size-7 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No subtasks yet</p>
          <p className="text-xs text-muted-foreground/70">
            Break this task into smaller steps or link an existing task.
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskChildren;
