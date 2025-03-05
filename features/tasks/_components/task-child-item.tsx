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
    <div className="flex flex-row justify-between items-center">
      <Link
        href={`/workspaces/${workspaceId}/tasks/${task.id}`}
        className="font-semibold"
      >
        {task.name}
      </Link>
      <button onClick={handleUnlinkChildTask}>
        <TrashIcon className="hover:opacity-50" />
      </button>
    </div>
  );
};

export default TaskChildItem;
