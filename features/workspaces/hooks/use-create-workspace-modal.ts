import { useUrlBooleanParam } from "@/hooks/use-url-query-state";

const useCreateWorkspaceModal = () => {
  const [isOpen, setIsOpen] = useUrlBooleanParam("create-workspace");
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  return {
    isOpen,
    open,
    close,
    setIsOpen,
  };
};
export default useCreateWorkspaceModal;
