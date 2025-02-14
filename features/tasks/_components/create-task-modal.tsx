"use client";
import ResponsiveModal from "@/components/responsive-modal";
import useCreateTaskModal from "../hooks/use-create-task-modal";

interface CreateTaskModalProps {}

const CreateTaskModal = ({}: CreateTaskModalProps) => {
  const { isOpen, setIsOpen } = useCreateTaskModal();
  return (
    <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
      <div>Task form</div>
    </ResponsiveModal>
  );
};

export default CreateTaskModal;
