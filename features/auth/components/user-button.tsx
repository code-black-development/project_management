"use client";
import MemberAvatar from "@/features/members/_components/member-avatar";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { signOut } from "next-auth/react";
import DottedSeparator from "@/components/dotted-separator";
import { LogOut, User } from "lucide-react";
import Link from "next/link";

interface UserButtonProps {}

const UserButton = ({}: UserButtonProps) => {
  const { data: session } = useSession();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="outline-none relative">
        <MemberAvatar
          name={session?.user?.name || "U"}
          className="size-10 hover:opacity-75 transition"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        className="w-60"
        sideOffset={10}
      >
        <div className="flex flex-col items-center justify-center gap-2 px-2.5 py-4">
          <MemberAvatar name={session?.user?.name || "U"} />
          <div className="flex flex-col items-center justify-center">
            <p className="text-sm text-neutral-900 font-medium">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs text-neutral-500"> {session?.user?.email}</p>
          </div>
          <DottedSeparator className="mb-1" />
          <DropdownMenuItem className="h-10 flex items-center justify-center text-amber-700 font-medium cursor-pointer">
            <Link href="">
              <User className="size-4 mr-2" />
              Edit Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="h-10 flex items-center justify-center text-amber-700 font-medium cursor-pointer"
            onClick={() => signOut()}
          >
            <LogOut className="size-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
