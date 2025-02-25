"use client";
import ResponsiveModal from "@/components/responsive-modal";

import useCreateTaskWorklogModal from "../hooks/use-create-task-worklog-modal";
import TaskWorklogForm from "./task-worklog-form";

export const CreateTaskWorklogModal = () => {
  const { isOpen, close, setIsOpen } = useCreateTaskWorklogModal();
  return (
    <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
      <TaskWorklogForm id={"test"} onCancel={close} />
    </ResponsiveModal>
  );
};
export default CreateTaskWorklogModal;
