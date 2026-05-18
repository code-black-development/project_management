import {
  useUrlQuerySetter,
  useUrlStringParam,
} from "@/hooks/use-url-query-state";

interface ParentTaskInfo {
  taskId: string;
  projectId: string;
  workspaceId: string;
}

const useCreateChildTaskModal = () => {
  const [parentTaskId] = useUrlStringParam("create-child-task-parent");
  const [parentProjectId] = useUrlStringParam("create-child-task-project");
  const [parentWorkspaceId] = useUrlStringParam("create-child-task-workspace");
  const setQuery = useUrlQuerySetter();

  const isOpen = Boolean(parentTaskId && parentProjectId && parentWorkspaceId);

  const parentTaskInfo: ParentTaskInfo | null = isOpen
    ? {
        taskId: parentTaskId!,
        projectId: parentProjectId!,
        workspaceId: parentWorkspaceId!,
      }
    : null;

  const open = (taskInfo: ParentTaskInfo) => {
    setQuery({
      "create-child-task-parent": taskInfo.taskId,
      "create-child-task-project": taskInfo.projectId,
      "create-child-task-workspace": taskInfo.workspaceId,
    });
  };

  const close = () => {
    setQuery({
      "create-child-task-parent": null,
      "create-child-task-project": null,
      "create-child-task-workspace": null,
    });
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
