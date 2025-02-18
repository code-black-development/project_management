import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLinkIcon, PencilIcon, TrashIcon } from "lucide-react";

import { useConfirm } from "@/hooks/use-confirm";
import { useDeleteTask } from "../api/use-delete-task";
import { useRouter } from "next/navigation";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import useEditTaskModal from "../hooks/use-edit-task-modal";

interface TaskActionsProps {
  id: string;
  projectId: string;
  children?: React.ReactNode;
}

const TaskActions = ({ id, projectId, children }: TaskActionsProps) => {
  const workspaceId = useWorkspaceId();
  const router = useRouter();

  const { open } = useEditTaskModal();

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete Task",
    "This action acannot be undone",
    "destructive"
  );
  const { mutate: deleteTask, isPending } = useDeleteTask();

  const onDelete = async () => {
    const response = await confirm();
    if (!response) return;
    deleteTask({ param: { taskId: id } });
  };

  const onOpenTask = () => {
    router.push(`/workspaces/${workspaceId}/task/${id}`);
  };

  const onOpenProject = () => {
    router.push(`/workspaces/${workspaceId}/project/${projectId}`);
  };

  return (
    <div className="flex justify-end">
      <ConfirmDialog />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={onOpenTask}
            className="font-medium p-[10px]"
          >
            <ExternalLinkIcon className="mr-2 size=4 stroke-2" />
            Task Details
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => open(id)}
            disabled={false}
            className="font-medium p-[10px]"
          >
            <PencilIcon className="mr-2 size=4 stroke-2" />
            Edit Task
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onOpenProject}
            className="font-medium p-[10px]"
          >
            <ExternalLinkIcon className="mr-2 size=4 stroke-2" />
            Open Project
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDelete}
            disabled={isPending}
            className="text-amber-700 focus:text-amber-700 font-medium p-[10px]"
          >
            <TrashIcon className="mr-2 size=4 stroke-2" />
            Delete Task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TaskActions;
