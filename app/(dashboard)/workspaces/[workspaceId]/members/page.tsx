import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import {
  getMemberByUserIdAndWorkspaceId,
  getWorkspaceMembersWithStats,
} from "@/lib/dbService/workspace-members";
import {
  formatMemberRole,
  formatOptionalDate,
  getMemberDisplayName,
  getMemberInitials,
} from "@/features/members/utils";
import Link from "next/link";
import { redirect } from "next/navigation";

const MembersPage = async ({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { workspaceId } = await params;
  const currentMember = await getMemberByUserIdAndWorkspaceId(
    session.user.id,
    workspaceId
  );

  if (!currentMember) {
    redirect(`/workspaces/${workspaceId}`);
  }

  const members = await getWorkspaceMembersWithStats(workspaceId);
  const totalAssignedTasks = members.reduce(
    (sum, m) => sum + m._count.assignedTasks,
    0
  );
  const adminCount = members.filter((m) => m.role === "admin").length;

  return (
    <div className="flex flex-col gap-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Members</h1>
        <p className="text-sm text-muted-foreground">
          Browse everyone in this workspace and open a member profile for task
          and activity details.
        </p>
      </div>

      {/* Compact stat strip */}
      <div className="flex items-center gap-x-6 px-5 py-3 bg-card border border-border rounded-xl w-fit">
        <Stat value={members.length} label="members" />
        <div className="h-4 w-px bg-border" />
        <Stat value={totalAssignedTasks} label="assigned tasks" />
        <div className="h-4 w-px bg-border" />
        <Stat value={adminCount} label={adminCount === 1 ? "admin" : "admins"} />
      </div>

      {/* Member grid */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {members.map((member) => {
          const displayName = getMemberDisplayName(
            member.user.name,
            member.user.email
          );
          const initials = getMemberInitials(member.user.name, member.user.email);

          return (
            <Link
              key={member.id}
              href={`/workspaces/${workspaceId}/members/${member.id}`}
            >
              <div className="group flex items-center gap-x-3.5 px-4 py-3.5 bg-card border border-border rounded-xl hover:bg-accent transition-colors cursor-pointer">
                {/* Avatar */}
                <div className="size-10 shrink-0 flex items-center justify-center rounded-lg bg-muted text-xs font-semibold text-foreground group-hover:bg-card transition-colors">
                  {initials}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-x-2">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {displayName}
                    </span>
                    <Badge
                      variant="secondary"
                      className="shrink-0 text-[11px] px-1.5 py-0"
                    >
                      {formatMemberRole(member.role)}
                    </Badge>
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
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const Stat = ({ value, label }: { value: number; label: string }) => (
  <div className="flex items-baseline gap-x-1.5">
    <span className="text-lg font-semibold text-foreground">{value}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

export default MembersPage;
