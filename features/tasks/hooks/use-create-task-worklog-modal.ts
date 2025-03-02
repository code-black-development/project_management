import { useQueryState, parseAsString } from "nuqs";
const useCreateTaskWorklogModal = () => {
  const [taskId, setTaskId] = useQueryState("create-worklog", parseAsString);
  const open = (id: string) => setTaskId(id);
  const close = () => setTaskId(null);
  return {
    taskId,
    open,
    close,
    setTaskId,
  };
};
export default useCreateTaskWorklogModal;
