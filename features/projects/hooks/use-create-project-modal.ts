import { useUrlBooleanParam } from "@/hooks/use-url-query-state";

const useCreateProjectModal = () => {
  const [isOpen, setIsOpen] = useUrlBooleanParam("create-project");
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  return {
    isOpen,
    open,
    close,
    setIsOpen,
  };
};
export default useCreateProjectModal;
