"use client";
import ResponsiveModal from "@/components/responsive-modal";

import useCreateTaskWorklogModal from "../hooks/use-create-task-worklog-modal";
import TaskWorklogForm from "./task-worklog-form";

export const CreateTaskWorklogModal = () => {
  const { taskId, worklogId, isEditing, close } = useCreateTaskWorklogModal();

  return (
    <ResponsiveModal open={!!taskId} onOpenChange={close}>
      {taskId && (
        <TaskWorklogForm
          id={taskId}
          worklogId={worklogId || undefined}
          onCancel={close}
        />
      )}
    </ResponsiveModal>
  );
};
export default CreateTaskWorklogModal;
