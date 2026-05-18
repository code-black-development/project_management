import {
  useUrlQuerySetter,
  useUrlStringParam,
} from "@/hooks/use-url-query-state";

const useCreateTaskWorklogModal = () => {
  const [taskId, setTaskId] = useUrlStringParam("create-worklog");
  const [worklogId] = useUrlStringParam("edit-worklog");
  const setQuery = useUrlQuerySetter();

  const open = (id: string) => setTaskId(id);
  const close = () => {
    setQuery({ "create-worklog": null, "edit-worklog": null });
  };

  const openEdit = (taskId: string, worklogId: string) => {
    setQuery({ "create-worklog": taskId, "edit-worklog": worklogId });
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
