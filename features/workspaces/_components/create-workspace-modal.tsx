"use client";
import ResponsiveModal from "@/components/responsive-modal";
import WorkspaceForm from "./create-workspace-form";
import useCreateWorkspaceModal from "../hooks/use-create-workspace-modal";

export const CreateWorkspaceModal = () => {
  const { isOpen, close, setIsOpen } = useCreateWorkspaceModal();
  return (
    <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
      <WorkspaceForm onCancel={close} />
    </ResponsiveModal>
  );
};
export default CreateWorkspaceModal;
