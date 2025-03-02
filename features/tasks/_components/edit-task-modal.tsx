"use client";
import ResponsiveModal from "@/components/responsive-modal";
import useEditTaskModal from "../hooks/use-edit-task-modal";
import TaskFormWrapper from "./task-form-wrapper";

interface EditTaskModalProps {}

const EditTaskModal = ({}: EditTaskModalProps) => {
  const { taskId, setTaskId, close } = useEditTaskModal();
  return (
    <ResponsiveModal open={!!taskId} onOpenChange={close}>
      {taskId && <TaskFormWrapper id={taskId} onCancel={close} />}
    </ResponsiveModal>
  );
};

export default EditTaskModal;
