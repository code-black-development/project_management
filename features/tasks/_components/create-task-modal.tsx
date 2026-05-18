"use client";
import ResponsiveModal from "@/components/responsive-modal";
import useCreateTaskModal from "../hooks/use-create-task-modal";
import TaskFormWrapper from "./task-form-wrapper";

interface CreateTaskModalProps {}

const CreateTaskModal = ({}: CreateTaskModalProps) => {
  const { isOpen, setIsOpen, close } = useCreateTaskModal();
  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Create task"
      contentClassName="sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[92vh]"
    >
      <TaskFormWrapper onCancel={close} />
    </ResponsiveModal>
  );
};

export default CreateTaskModal;
