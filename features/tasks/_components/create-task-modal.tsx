"use client";
import ResponsiveModal from "@/components/responsive-modal";
import useCreateTaskModal from "../hooks/use-create-task-modal";
import TaskFormWrapper from "./task-form-wrapper";

interface CreateTaskModalProps {}

const CreateTaskModal = ({}: CreateTaskModalProps) => {
  const { isOpen, setIsOpen, close } = useCreateTaskModal();
  return (
    <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
      <TaskFormWrapper onCancel={close} />
    </ResponsiveModal>
  );
};

export default CreateTaskModal;
