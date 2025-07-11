"use client";

import { useRouter, useSearchParams } from "next/navigation";

export const useUserSettingsModal = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isOpen = searchParams.get("user-settings") === "true";

  const open = () => {
    router.push(`?user-settings=true`);
  };

  const close = () => {
    router.push("?");
  };

  return {
    isOpen,
    open,
    close,
    setOpen: (isOpen: boolean) => (isOpen ? open() : close()),
  };
};

export default useUserSettingsModal;
