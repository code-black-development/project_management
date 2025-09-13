"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface ParentTaskInfo {
  taskId: string;
  projectId: string;
  workspaceId: string;
}

interface CreateChildTaskModalContextType {
  isOpen: boolean;
  parentTaskInfo: ParentTaskInfo | null;
  open: (taskInfo: ParentTaskInfo) => void;
  close: () => void;
  setIsOpen: (open: boolean) => void;
}

const CreateChildTaskModalContext = createContext<
  CreateChildTaskModalContextType | undefined
>(undefined);

export const CreateChildTaskModalProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [parentTaskInfo, setParentTaskInfo] = useState<ParentTaskInfo | null>(
    null
  );

  const open = (taskInfo: ParentTaskInfo) => {
    console.log("Context: Opening child task modal with info:", taskInfo);
    setParentTaskInfo(taskInfo);
    setIsOpen(true);
  };

  const close = () => {
    console.log("Context: Closing child task modal");
    setIsOpen(false);
    setParentTaskInfo(null);
  };

  return (
    <CreateChildTaskModalContext.Provider
      value={{
        isOpen,
        parentTaskInfo,
        open,
        close,
        setIsOpen,
      }}
    >
      {children}
    </CreateChildTaskModalContext.Provider>
  );
};

export const useCreateChildTaskModal = () => {
  const context = useContext(CreateChildTaskModalContext);
  if (context === undefined) {
    throw new Error(
      "useCreateChildTaskModal must be used within a CreateChildTaskModalProvider"
    );
  }
  return context;
};
