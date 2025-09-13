import { useQueryState, parseAsString } from "nuqs";

interface ParentTaskInfo {
  taskId: string;
  projectId: string;
  workspaceId: string;
}

const useCreateChildTaskModal = () => {
  const [parentTaskId, setParentTaskId] = useQueryState(
    "create-child-task-parent",
    parseAsString
  );
  const [parentProjectId, setParentProjectId] = useQueryState(
    "create-child-task-project",
    parseAsString
  );
  const [parentWorkspaceId, setParentWorkspaceId] = useQueryState(
    "create-child-task-workspace",
    parseAsString
  );

  const isOpen = Boolean(parentTaskId && parentProjectId && parentWorkspaceId);

  const parentTaskInfo: ParentTaskInfo | null = isOpen
    ? {
        taskId: parentTaskId!,
        projectId: parentProjectId!,
        workspaceId: parentWorkspaceId!,
      }
    : null;

  const open = (taskInfo: ParentTaskInfo) => {
    console.log("Opening child task modal with info:", taskInfo);
    setParentTaskId(taskInfo.taskId);
    setParentProjectId(taskInfo.projectId);
    setParentWorkspaceId(taskInfo.workspaceId);
  };

  const close = () => {
    console.log("Closing child task modal");
    setParentTaskId(null);
    setParentProjectId(null);
    setParentWorkspaceId(null);
  };

  const setIsOpen = (open: boolean) => {
    if (!open) {
      close();
    }
  };

  return {
    isOpen,
    open,
    close,
    setIsOpen,
    parentTaskInfo,
  };
};

export default useCreateChildTaskModal;
