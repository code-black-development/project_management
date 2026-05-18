import { useUrlStringParam } from "@/hooks/use-url-query-state";

const useEditTaskModal = () => {
  const [taskId, setTaskId] = useUrlStringParam("edit-task");
  const open = (id: string) => setTaskId(id);
  const close = () => setTaskId(null);
  return {
    taskId,
    open,
    close,
    setTaskId,
  };
};
export default useEditTaskModal;
