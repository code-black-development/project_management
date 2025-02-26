"use client";
import ResponsiveModal from "@/components/responsive-modal";

import useCreateTaskWorklogModal from "../hooks/use-create-task-worklog-modal";
import TaskWorklogForm from "./task-worklog-form";

export const CreateTaskWorklogModal = () => {
  const { taskId, setTaskId, close } = useCreateTaskWorklogModal();
  return (
    <ResponsiveModal open={!!taskId} onOpenChange={close}>
      <TaskWorklogForm id={taskId!} onCancel={close} />
    </ResponsiveModal>
  );
};
export default CreateTaskWorklogModal;
