import { Card, CardContent } from "@/components/ui/card";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { Loader } from "lucide-react";
import TaskForm from "./task-form";
import { useGetTask } from "../api/use-get-task";
import { TaskWithUser } from "@/types/types";

interface CreateTaskFormWrapperProps {
  onCancel: () => void;
  id?: string;
  parentTaskInfo?: {
    taskId: string;
    projectId: string;
    workspaceId: string;
  };
}

const TaskFormWrapper = ({
  onCancel,
  id,
  parentTaskInfo,
}: CreateTaskFormWrapperProps) => {
  const workspaceId = useWorkspaceId();

  // Use parent task workspace if creating a child task
  const targetWorkspaceId = parentTaskInfo?.workspaceId || workspaceId;

  const { data: task, isLoading: isLoadingTask } = id
    ? useGetTask({ taskId: id })
    : { data: undefined, isLoading: false };

  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({
    workspaceId: targetWorkspaceId,
  });

  const { data: members, isLoading: isLoadingMembers } = useGetMembers({
    workspaceId: targetWorkspaceId,
  });

  const isLoading = isLoadingProjects || isLoadingMembers || isLoadingTask;

  if (isLoading) {
    return (
      <Card className="w-full h-[714px] border-none shadow-none">
        <CardContent className="flex items-center justify-center h-full">
          <Loader className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <TaskForm
      initialValues={task ? (task as unknown as TaskWithUser) : undefined}
      projectOptions={projects ?? []}
      memberOptions={members?.data ?? []}
      onCancel={onCancel}
      parentTaskInfo={parentTaskInfo}
    />
  );
};

export default TaskFormWrapper;
