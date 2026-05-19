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
import { LogOut, User } from "lucide-react";
import Link from "next/link";

const UserButton = () => {
  const { data: session } = useSession();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="outline-none relative">
        <MemberAvatar
          name={session?.user?.name || "U"}
          image={session?.user?.image || undefined}
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
          <MemberAvatar
            name={session?.user?.name || "U"}
            image={session?.user?.image || undefined}
          />
          <div className="flex flex-col items-center justify-center">
            <p className="text-sm text-foreground font-medium">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground">
              {session?.user?.email}
            </p>
          </div>
          <div className="w-full border-t border-border" />
          <DropdownMenuItem asChild className="h-10 w-full cursor-pointer">
            <Link href="/profile" className="flex flex-row gap-2 items-center justify-center font-medium">
              <User className="size-4 mr-2" />
              My Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="h-10 flex items-center justify-center text-destructive focus:text-destructive font-medium cursor-pointer"
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
