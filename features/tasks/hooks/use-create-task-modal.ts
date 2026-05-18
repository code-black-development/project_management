import { useUrlBooleanParam } from "@/hooks/use-url-query-state";

const useCreateTaskModal = () => {
  const [isOpen, setIsOpen] = useUrlBooleanParam("create-task");
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  return {
    isOpen,
    open,
    close,
    setIsOpen,
  };
};
export default useCreateTaskModal;
