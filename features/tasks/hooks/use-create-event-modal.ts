import { useUrlBooleanParam } from "@/hooks/use-url-query-state";

const useCreateEventModal = () => {
  const [isOpen, setIsOpen] = useUrlBooleanParam("create-event");

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return {
    isOpen,
    open,
    close,
    setIsOpen,
  };
};

export default useCreateEventModal;
