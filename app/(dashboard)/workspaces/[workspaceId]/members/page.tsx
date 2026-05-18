import { auth } from "@/auth";
import {
  getMemberByUserIdAndWorkspaceId,
  getWorkspaceMembersWithStats,
} from "@/lib/dbService/workspace-members";
import MembersList from "@/features/members/_components/members-list";
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
      <MembersList
        members={members}
        workspaceId={workspaceId}
        isAdmin={currentMember.role === "admin"}
        currentMemberId={currentMember.id}
      />
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
