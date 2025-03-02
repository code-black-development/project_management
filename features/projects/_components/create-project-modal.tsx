"use client";
import ResponsiveModal from "@/components/responsive-modal";
import useCreateProjectModal from "../hooks/use-create-project-modal";
import ProjectForm from "./project-form";

export const CreateProjectModal = () => {
  const { isOpen, close, setIsOpen } = useCreateProjectModal();
  return (
    <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
      <ProjectForm onCancel={close} />
    </ResponsiveModal>
  );
};
export default CreateProjectModal;
