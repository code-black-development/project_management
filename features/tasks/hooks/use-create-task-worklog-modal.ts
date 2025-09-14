import { useQueryState, parseAsString } from "nuqs";

const useCreateTaskWorklogModal = () => {
  const [taskId, setTaskId] = useQueryState("create-worklog", parseAsString);
  const [worklogId, setWorklogId] = useQueryState("edit-worklog", parseAsString);
  
  const open = (id: string) => setTaskId(id);
  const close = () => {
    setTaskId(null);
    setWorklogId(null);
  };
  
  const openEdit = (taskId: string, worklogId: string) => {
    setTaskId(taskId);
    setWorklogId(worklogId);
  };
  
  const isEditing = !!worklogId;
  
  return {
    taskId,
    worklogId,
    isEditing,
    open,
    openEdit,
    close,
    setTaskId,
  };
};

export default useCreateTaskWorklogModal;
