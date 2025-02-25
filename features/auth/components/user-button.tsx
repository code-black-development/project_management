"use client";
import MemberAvatar from "@/features/members/_components/member-avatar";
import { useSession } from "next-auth/react";
interface UserButtonProps {}

const UserButton = ({}: UserButtonProps) => {
  const { data: session } = useSession();

  return (
    <div className="flex items-center gap-x-2">
      <MemberAvatar name={session?.user?.name || "test"} />
      <p>{session?.user?.email}</p>
    </div>
  );
};

export default UserButton;
