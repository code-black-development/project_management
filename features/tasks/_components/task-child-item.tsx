import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { TaskSafeDate } from "@/types/types";
import { TrashIcon } from "lucide-react";
import Link from "next/link";
import { useDeleteLinkedTask } from "../api/use-delete-linked-task";

interface TaskChildItemProps {
  task: TaskSafeDate;
}

const TaskChildItem = ({ task }: TaskChildItemProps) => {
  const workspaceId = useWorkspaceId();
  const { mutate } = useDeleteLinkedTask();

  const handleUnlinkChildTask = async () => {
    await mutate(
      { json: { childTask: task.id, parentId: task.parentId! } },
      { onSuccess: () => {} }
    );
  };
  return (
    <div className="flex items-center justify-between gap-x-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors group">
      <Link
        href={`/workspaces/${workspaceId}/tasks/${task.id}`}
        className="text-sm font-medium text-foreground truncate hover:text-primary transition-colors"
      >
        {task.name}
      </Link>
      <button
        onClick={handleUnlinkChildTask}
        className="shrink-0 h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
        title="Unlink subtask"
      >
        <TrashIcon className="size-3.5" />
      </button>
    </div>
  );
};

export default TaskChildItem;
