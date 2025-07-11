"use client";

import ResponsiveModal from "@/components/responsive-modal";
import useUserSettingsModal from "../hooks/use-user-settings-modal";
import UserSettingsForm from "./user-settings-form";

export const UserSettingsModal = () => {
  const { isOpen, close, setOpen } = useUserSettingsModal();

  return (
    <ResponsiveModal open={isOpen} onOpenChange={setOpen}>
      <UserSettingsForm onCancel={close} />
    </ResponsiveModal>
  );
};

export default UserSettingsModal;
