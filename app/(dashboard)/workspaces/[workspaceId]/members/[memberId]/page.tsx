import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import {
  getMemberByUserIdAndWorkspaceId,
  getWorkspaceMemberDetails,
} from "@/lib/dbService/workspace-members";
import EditMemberUsernameForm from "@/features/members/_components/edit-member-username-form";
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
import { ChevronRightIcon } from "lucide-react";

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
    <div className="flex flex-col gap-y-6">
      {/* Breadcrumb + page title */}
      <div className="flex flex-col gap-y-2">
        <div className="flex items-center gap-x-1.5 text-sm text-muted-foreground">
          <Link
            href={`/workspaces/${workspaceId}/members`}
            className="hover:text-foreground transition-colors"
          >
            Members
          </Link>
          <ChevronRightIcon className="size-3.5 shrink-0" />
          <span>{displayName}</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground leading-snug">
          {displayName}
        </h1>
        <p className="text-sm text-muted-foreground">{member.user.email}</p>
      </div>

      {/* Content grid — items-start keeps left column height content-driven */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr] items-start">
        {/* Profile card */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-y-4">
          <p className="text-sm font-semibold text-foreground">Profile</p>

          <div className="flex items-center gap-x-3">
            <div className="size-12 shrink-0 flex items-center justify-center rounded-lg bg-muted text-sm font-semibold text-foreground">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{displayName}</p>
              <Badge variant="secondary" className="mt-1 text-[11px] px-1.5 py-0">
                {formatMemberRole(member.role)}
              </Badge>
            </div>
          </div>

          <div className="border-t border-border pt-4 flex flex-col gap-y-2.5 text-sm">
            <ProfileRow label="Joined" value={formatOptionalDate(member.createdAt)} />
            <ProfileRow
              label="Last login"
              value={formatOptionalDate(member.user.lastLoginAt, "Not recorded")}
            />
            <ProfileRow
              label="Last active"
              value={formatRelativeDate(member.user.lastLoginAt, "Not recorded")}
            />
            <ProfileRow
              label="Email verified"
              value={
                member.user.emailVerified
                  ? formatOptionalDate(member.user.emailVerified)
                  : "Not verified"
              }
            />
            <ProfileRow
              label="Recent worklog"
              value={formatOptionalDate(member.stats.lastWorkedAt, "None")}
            />
          </div>

          {currentMember.role === "admin" && (
            <div className="border-t border-border pt-4">
              <EditMemberUsernameForm
                memberId={member.id}
                workspaceId={workspaceId}
                currentName={member.user.name}
              />
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-y-4">
          {/* Stat strip */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              label="Assigned"
              value={member.stats.assignedTasks}
              caption={`${member.stats.openAssignedTasks} open`}
            />
            <StatCard
              label="Completed"
              value={member.stats.completedAssignedTasks}
              caption={`${member.stats.overdueAssignedTasks} overdue`}
            />
            <StatCard
              label="Created"
              value={member.stats.createdTasks}
            />
            <StatCard
              label="Logged time"
              value={minutesToTimeEstimateString(member.stats.totalLoggedMinutes) || "0m"}
              caption={`${member.stats.worklogEntries} entries`}
            />
          </div>

          {/* Recent assigned tasks */}
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm font-semibold text-foreground border-b border-border pb-4 mb-4">
              Recent Assigned Tasks
            </p>
            <div className="flex flex-col gap-y-2">
              {member.assignedTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assigned tasks yet.</p>
              ) : (
                member.assignedTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/workspaces/${workspaceId}/tasks/${task.id}`}
                    className="flex items-start justify-between gap-x-4 px-3 py-2.5 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{task.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {task.project.name} · Due {formatOptionalDate(task.dueDate, "No due date")}
                      </p>
                    </div>
                    <TaskBadge variant={task.status} className="shrink-0">
                      {snakeCaseToTitleCase(task.status)}
                    </TaskBadge>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent worklogs */}
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm font-semibold text-foreground border-b border-border pb-4 mb-4">
              Recent Worklogs
            </p>
            <div className="flex flex-col gap-y-2">
              {member.Worklog.length === 0 ? (
                <p className="text-sm text-muted-foreground">No worklogs recorded yet.</p>
              ) : (
                member.Worklog.map((worklog) => (
                  <Link
                    key={worklog.id}
                    href={`/workspaces/${workspaceId}/tasks/${worklog.task.id}`}
                    className="flex items-start justify-between gap-x-4 px-3 py-2.5 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{worklog.task.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {worklog.task.project.name} · Logged {formatOptionalDate(worklog.dateWorked)}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {minutesToTimeEstimateString(worklog.timeSpent)}
                    </Badge>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-x-4">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className="text-foreground text-right">{value}</span>
  </div>
);

const StatCard = ({
  label,
  value,
  caption,
}: {
  label: string;
  value: number | string;
  caption?: string;
}) => (
  <div className="bg-card border border-border rounded-xl px-4 py-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-xl font-semibold text-foreground mt-1">{value}</p>
    {caption && <p className="text-xs text-muted-foreground mt-0.5">{caption}</p>}
  </div>
);

export default MemberDetailsPage;
