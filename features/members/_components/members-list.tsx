"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontalIcon, UserXIcon, UserCheckIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatMemberRole,
  formatOptionalDate,
  getMemberDisplayName,
  getMemberInitials,
} from "@/features/members/utils";
import { useSuspendMember } from "../api/use-suspend-member";

interface Member {
  id: string;
  role: string;
  suspended: boolean;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  };
  _count: {
    assignedTasks: number;
    createdTasks: number;
  };
}

interface MembersListProps {
  members: Member[];
  workspaceId: string;
  isAdmin: boolean;
  currentMemberId: string;
}

const MembersList = ({ members, workspaceId, isAdmin, currentMemberId }: MembersListProps) => {
  const router = useRouter();
  const { mutate: suspendMember, isPending: isSuspending } = useSuspendMember();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleSuspend = (memberId: string, suspended: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    suspendMember(
      { memberId, suspended, workspaceId },
      {
        onSuccess: () => {
          toast.success(suspended ? "Member suspended" : "Member reinstated");
          router.refresh();
        },
        onError: (err) => toast.error(err.message || "Failed to update member"),
      },
    );
  };

  const handleRemove = async (memberId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRemovingId(memberId);
    try {
      const response = await fetch(
        `/api/members/${memberId}?workspaceId=${workspaceId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to remove member");
      }
      toast.success("Member removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      {members.map((member) => {
        const displayName = getMemberDisplayName(member.user.name, member.user.email);
        const initials = getMemberInitials(member.user.name, member.user.email);
        const isSelf = member.id === currentMemberId;
        const isActing = isSuspending || removingId === member.id;

        return (
          <div key={member.id} className="relative group">
            <Link href={`/workspaces/${workspaceId}/members/${member.id}`}>
              <div className={`flex items-center gap-x-3.5 px-4 py-3.5 bg-card border border-border rounded-xl hover:bg-accent transition-colors cursor-pointer ${member.suspended ? "opacity-60" : ""}`}>
                {/* Avatar */}
                <div className="size-10 shrink-0 flex items-center justify-center rounded-lg bg-muted text-xs font-semibold text-foreground">
                  {initials}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-x-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {displayName}
                    </span>
                    <Badge variant="secondary" className="shrink-0 text-[11px] px-1.5 py-0">
                      {formatMemberRole(member.role)}
                    </Badge>
                    {member.suspended && (
                      <Badge variant="destructive" className="shrink-0 text-[11px] px-1.5 py-0">
                        Suspended
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {member.user.email}
                  </p>
                  <div className="flex items-center gap-x-2.5 mt-1.5 text-xs text-muted-foreground/70 flex-wrap">
                    <span>{member._count.assignedTasks} assigned</span>
                    <span>·</span>
                    <span>{member._count.createdTasks} created</span>
                    <span>·</span>
                    <span>Joined {formatOptionalDate(member.createdAt)}</span>
                  </div>
                </div>

                {/* Admin actions — rendered inside the link div but the dropdown stops propagation */}
                {isAdmin && !isSelf && (
                  <div
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          disabled={isActing}
                        >
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="dark:bg-card dark:text-foreground">
                        <DropdownMenuItem
                          onClick={(e) => handleSuspend(member.id, !member.suspended, e)}
                        >
                          {member.suspended ? (
                            <>
                              <UserCheckIcon className="size-4 mr-2" />
                              Reinstate
                            </>
                          ) : (
                            <>
                              <UserXIcon className="size-4 mr-2" />
                              Suspend
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => handleRemove(member.id, e)}
                        >
                          <Trash2Icon className="size-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default MembersList;
