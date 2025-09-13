import { useState } from "react";

interface ParentTaskInfo {
  taskId: string;
  projectId: string;
  workspaceId: string;
}

const useCreateChildTaskModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [parentTaskInfo, setParentTaskInfo] = useState<ParentTaskInfo | null>(
    null
  );

  const open = (taskInfo: ParentTaskInfo) => {
    console.log("Opening child task modal with info:", taskInfo);
    setParentTaskInfo(taskInfo);
    setIsOpen(true);
  };

  const close = () => {
    console.log("Closing child task modal");
    setIsOpen(false);
    setParentTaskInfo(null);
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
