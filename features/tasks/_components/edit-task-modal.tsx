"use client";
import ResponsiveModal from "@/components/responsive-modal";
import useEditTaskModal from "../hooks/use-edit-task-modal";
import TaskFormWrapper from "./task-form-wrapper";

interface EditTaskModalProps {}

const EditTaskModal = ({}: EditTaskModalProps) => {
  const { taskId, setTaskId, close } = useEditTaskModal();
  return (
    <ResponsiveModal
      open={!!taskId}
      onOpenChange={close}
      title="Edit task"
      contentClassName="sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[92vh]"
    >
      {taskId && <TaskFormWrapper id={taskId} onCancel={close} />}
    </ResponsiveModal>
  );
};

export default EditTaskModal;
