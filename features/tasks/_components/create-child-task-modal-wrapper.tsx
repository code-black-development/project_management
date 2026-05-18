"use client";
import ResponsiveModal from "@/components/responsive-modal";
import useCreateChildTaskModal from "../hooks/use-create-child-task-modal";
import TaskFormWrapper from "./task-form-wrapper";

const CreateChildTaskModalWrapper = () => {
  const { isOpen, setIsOpen, close, parentTaskInfo } =
    useCreateChildTaskModal();

  // Don't render if not open or no parent task info
  if (!isOpen || !parentTaskInfo) {
    return null;
  }

  return (
    <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
      <TaskFormWrapper onCancel={close} parentTaskInfo={parentTaskInfo} />
    </ResponsiveModal>
  );
};

export default CreateChildTaskModalWrapper;
