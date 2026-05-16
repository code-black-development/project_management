import { auth } from "@/auth";
import DottedSeparator from "@/components/dotted-separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    (sum, member) => sum + member._count.assignedTasks,
    0
  );

  return (
    <div className="h-full flex flex-col gap-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">
          Browse everyone in this workspace and open a member profile for task
          and activity details.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label="Workspace Members" value={members.length} />
        <SummaryCard
          label="Assigned Tasks"
          value={totalAssignedTasks}
          caption="Across all members"
        />
        <SummaryCard
          label="Admins"
          value={members.filter((member) => member.role === "admin").length}
          caption="Members with admin access"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {members.map((member) => {
          const displayName = getMemberDisplayName(
            member.user.name,
            member.user.email
          );

          return (
            <Card key={member.id} className="shadow-none">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-muted text-sm font-semibold text-foreground">
                    {getMemberInitials(member.user.name, member.user.email)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <Link
                          href={`/workspaces/${workspaceId}/members/${member.id}`}
                          className="block truncate text-lg font-semibold hover:underline"
                        >
                          {displayName}
                        </Link>
                        <p className="truncate text-sm text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>

                      <Badge variant="secondary">
                        {formatMemberRole(member.role)}
                      </Badge>
                    </div>

                    <DottedSeparator />

                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                      <InfoBlock
                        label="Last login"
                        value={formatOptionalDate(
                          member.user.lastLoginAt,
                          "Not recorded yet"
                        )}
                      />
                      <InfoBlock
                        label="Assigned"
                        value={member._count.assignedTasks}
                      />
                      <InfoBlock
                        label="Created"
                        value={member._count.createdTasks}
                      />
                      <InfoBlock
                        label="Joined"
                        value={formatOptionalDate(member.createdAt)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const SummaryCard = ({
  label,
  value,
  caption,
}: {
  label: string;
  value: number | string;
  caption?: string;
}) => {
  return (
    <Card className="shadow-none">
      <CardContent className="space-y-2 p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        {caption ? <p className="text-xs text-muted-foreground">{caption}</p> : null}
      </CardContent>
    </Card>
  );
};

const InfoBlock = ({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) => {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
};

export default MembersPage;
