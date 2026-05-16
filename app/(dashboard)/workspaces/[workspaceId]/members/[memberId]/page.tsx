import { auth } from "@/auth";
import DottedSeparator from "@/components/dotted-separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getMemberByUserIdAndWorkspaceId,
  getWorkspaceMemberDetails,
} from "@/lib/dbService/workspace-members";
import { minutesToTimeEstimateString, snakeCaseToTitleCase } from "@/lib/utils";
import { TaskBadge } from "@/features/tasks/_components/task-badge";
import {
  formatMemberRole,
  formatOptionalDate,
  formatRelativeDate,
  getMemberDisplayName,
  getMemberInitials,
} from "@/features/members/utils";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

const MemberDetailsPage = async ({
  params,
}: {
  params: Promise<{ workspaceId: string; memberId: string }>;
}) => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { workspaceId, memberId } = await params;
  const currentMember = await getMemberByUserIdAndWorkspaceId(
    session.user.id,
    workspaceId
  );

  if (!currentMember) {
    redirect(`/workspaces/${workspaceId}`);
  }

  const member = await getWorkspaceMemberDetails(workspaceId, memberId);

  if (!member) {
    notFound();
  }

  const displayName = getMemberDisplayName(member.user.name, member.user.email);
  const initials = getMemberInitials(member.user.name, member.user.email);

  return (
    <div className="h-full flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-2">
        <Link
          href={`/workspaces/${workspaceId}/members`}
          className="text-sm text-muted-foreground hover:text-foreground transition"
        >
          Back to members
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">{displayName}</h1>
        <p className="text-sm text-muted-foreground">{member.user.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <Card className="shadow-none">
          <CardHeader className="pb-4">
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-x-4">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-lg font-semibold text-foreground">
                {initials}
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold">{displayName}</p>
                <Badge variant="secondary">{formatMemberRole(member.role)}</Badge>
              </div>
            </div>

            <DottedSeparator />

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-x-4">
                <span className="text-muted-foreground">Joined workspace</span>
                <span>{formatOptionalDate(member.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-x-4">
                <span className="text-muted-foreground">Last login</span>
                <span>{formatOptionalDate(member.user.lastLoginAt, "Not recorded yet")}</span>
              </div>
              <div className="flex items-center justify-between gap-x-4">
                <span className="text-muted-foreground">Last active</span>
                <span>{formatRelativeDate(member.user.lastLoginAt, "Not recorded yet")}</span>
              </div>
              <div className="flex items-center justify-between gap-x-4">
                <span className="text-muted-foreground">Email verified</span>
                <span>
                  {member.user.emailVerified
                    ? formatOptionalDate(member.user.emailVerified)
                    : "Not verified"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-x-4">
                <span className="text-muted-foreground">Recent worklog</span>
                <span>{formatOptionalDate(member.stats.lastWorkedAt, "No work logged")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Assigned Tasks"
              value={member.stats.assignedTasks}
              caption={`${member.stats.openAssignedTasks} open`}
            />
            <StatCard
              label="Completed Tasks"
              value={member.stats.completedAssignedTasks}
              caption={`${member.stats.overdueAssignedTasks} overdue`}
            />
            <StatCard
              label="Created Tasks"
              value={member.stats.createdTasks}
              caption="Created in this workspace"
            />
            <StatCard
              label="Logged Time"
              value={minutesToTimeEstimateString(member.stats.totalLoggedMinutes) || "0m"}
              caption={`${member.stats.worklogEntries} worklog entries`}
            />
          </div>

          <Card className="shadow-none">
            <CardHeader className="pb-4">
              <CardTitle>Recent Assigned Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {member.assignedTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No assigned tasks yet.
                  </p>
                ) : (
                  member.assignedTasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/workspaces/${workspaceId}/tasks/${task.id}`}
                      className="block rounded-lg border p-4 transition hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-medium">{task.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {task.project.name}
                          </p>
                        </div>
                        <TaskBadge variant={task.status}>
                          {snakeCaseToTitleCase(task.status)}
                        </TaskBadge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Due {formatOptionalDate(task.dueDate, "No due date")}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-4">
              <CardTitle>Recent Worklogs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {member.Worklog.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No worklogs recorded yet.
                  </p>
                ) : (
                  member.Worklog.map((worklog) => (
                    <Link
                      key={worklog.id}
                      href={`/workspaces/${workspaceId}/tasks/${worklog.task.id}`}
                      className="block rounded-lg border p-4 transition hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-medium">{worklog.task.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {worklog.task.project.name}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {minutesToTimeEstimateString(worklog.timeSpent)}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Logged {formatOptionalDate(worklog.dateWorked)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  caption,
}: {
  label: string;
  value: number | string;
  caption: string;
}) => {
  return (
    <Card className="shadow-none">
      <CardContent className="space-y-2 p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  );
};

export default MemberDetailsPage;
