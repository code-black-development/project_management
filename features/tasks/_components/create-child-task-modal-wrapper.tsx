"use client";
import { Suspense } from "react";
import ResponsiveModal from "@/components/responsive-modal";
import useCreateChildTaskModal from "../hooks/use-create-child-task-modal";
import TaskFormWrapper from "./task-form-wrapper";

const CreateChildTaskModalWrapper = () => {
  const { isOpen, setIsOpen, close, parentTaskInfo } =
    useCreateChildTaskModal();

  console.log("Modal wrapper rendering - state:", { isOpen, parentTaskInfo });

  // Don't render if not open or no parent task info
  if (!isOpen || !parentTaskInfo) {
    console.log("Modal wrapper returning null - conditions not met");
    return null;
  }

  console.log("Modal wrapper rendering ResponsiveModal");

  return (
    <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
      <Suspense fallback={<div>Loading...</div>}>
        <TaskFormWrapper onCancel={close} parentTaskInfo={parentTaskInfo} />
      </Suspense>
    </ResponsiveModal>
  );
};

export default CreateChildTaskModalWrapper;
