"use client";
import ResponsiveModal from "@/components/responsive-modal";
import useCreateEventModal from "../hooks/use-create-event-modal";
import EventFormWrapper from "./event-form-wrapper";

interface CreateEventModalProps {}

const CreateEventModal = ({}: CreateEventModalProps) => {
  const { isOpen, setIsOpen, close } = useCreateEventModal();
  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={setIsOpen}
      contentClassName="sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[92vh]"
    >
      <EventFormWrapper onCancel={close} />
    </ResponsiveModal>
  );
};

export default CreateEventModal;
