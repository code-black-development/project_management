import { useQueryState, parseAsBoolean } from "nuqs";
const useCreateTaskWorklogModal = () => {
  const [isOpen, setIsOpen] = useQueryState(
    "create-worklog",
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  );
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  return {
    isOpen,
    open,
    close,
    setIsOpen,
  };
};
export default useCreateTaskWorklogModal;
