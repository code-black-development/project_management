"use client";

import PageError from "@/components/page-error";
import PageLoader from "@/components/page-loader";
import { Button } from "@/components/ui/button";
import { TaskBadge } from "@/features/tasks/_components/task-badge";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import useCreateProjectModal from "@/features/projects/hooks/use-create-project-modal";
import { useGetTasks } from "@/features/tasks/api/use-get-tasks";
import useCreateTaskModal from "@/features/tasks/hooks/use-create-task-modal";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { snakeCaseToTitleCase } from "@/lib/utils";
import {
  MemberSafeDate,
  ProjectSafeDate,
  TaskListItem,
  UserSafeDate,
} from "@/types/types";
import { TaskStatus } from "@prisma/client";
import {
  addDays,
  endOfDay,
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  isToday,
  isWithinInterval,
  startOfDay,
} from "date-fns";
import {
  ActivityIcon,
  AlertCircleIcon,
  ArrowUpRightIcon,
  FolderPlusIcon,
  PlusIcon,
  UserCheckIcon,
  UserPlusIcon,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type DashboardTask = TaskListItem;
type DashboardMember = MemberSafeDate & { user: UserSafeDate };

const WorkspaceIdClient = () => {
  const workspaceId = useWorkspaceId();
  const { data: session } = useSession();
  const { data: workspacesData } = useGetWorkspaces();

  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const workspaceName =
    workspacesData?.data?.find((w) => w.id === workspaceId)?.name ||
    "your workspace";

  const { data: members, isLoading: isLoadingMembers } = useGetMembers({
    workspaceId,
  });
  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({
    workspaceId,
  });
  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({
    workspaceId,
    search: null,
  });

  if (isLoadingMembers || isLoadingProjects || isLoadingTasks) {
    return <PageLoader />;
  }

  if (!members || !projects || !tasks) {
    return <PageError message="Failed to fetch workspace data" />;
  }

  const currentMember = members.data.find(
    (member) => member.user.id === session?.user?.id
  );
  const taskGroups = getTaskGroups(tasks, currentMember?.id);
  const projectHotspots = getProjectHotspots(projects, taskGroups.overdue);
  const recentActivity = getRecentActivity(tasks, projects, members.data);
  const overdueCount = taskGroups.overdue.length;
  const unassignedCount = taskGroups.unassigned.length;

  return (
    <div className="h-full flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-1">
        <h1 className="text-2xl font-semibold text-foreground">
          Hi {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          What needs attention now in{" "}
          <span className="font-medium text-foreground">{workspaceName}</span>.
        </p>
      </div>

      <SummaryStrip
        overdue={overdueCount}
        unassigned={unassignedCount}
        recentlyCompleted={taskGroups.recentlyCompleted.length}
        needsAttention={taskGroups.needsAttention.length}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="flex flex-col gap-4">
          <NeedsAttentionSection
            tasks={taskGroups.needsAttention}
            workspaceId={workspaceId}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <UnassignedSection
              tasks={taskGroups.unassigned}
              workspaceId={workspaceId}
            />
            <RecentlyCompletedSection
              tasks={taskGroups.recentlyCompleted}
              workspaceId={workspaceId}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <QuickActions
            workspaceId={workspaceId}
            currentMemberId={currentMember?.id}
          />
          <RecentActivity items={recentActivity} workspaceId={workspaceId} />
          {projectHotspots.length > 0 && (
            <ProjectHotspots items={projectHotspots} workspaceId={workspaceId} />
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryStrip = ({
  overdue,
  unassigned,
  recentlyCompleted,
  needsAttention,
}: {
  overdue: number;
  unassigned: number;
  recentlyCompleted: number;
  needsAttention: number;
}) => {
  const stats = [
    { value: overdue, label: "overdue" },
    { value: needsAttention, label: "needs attention" },
    { value: unassigned, label: "unassigned" },
    { value: recentlyCompleted, label: "completed recently" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 bg-card border border-border rounded-xl w-fit max-w-full">
      {stats.map((stat, index) => (
        <div key={stat.label} className="flex items-center gap-x-6">
          {index > 0 && <div className="h-4 w-px bg-border" />}
          <Stat value={stat.value} label={stat.label} />
        </div>
      ))}
    </div>
  );
};

const Stat = ({ value, label }: { value: number; label: string }) => (
  <div className="flex items-baseline gap-x-1.5">
    <span className="text-lg font-semibold text-foreground">{value}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

const NeedsAttentionSection = ({
  tasks,
  workspaceId,
}: {
  tasks: DashboardTask[];
  workspaceId: string;
}) => (
  <section id="needs-attention" className="bg-card border border-border rounded-xl p-5">
    <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Needs attention</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your overdue and upcoming todo and in-progress tasks.
        </p>
      </div>
      <Button variant="muted" size="sm" asChild>
        <Link href={`/workspaces/${workspaceId}/tasks`}>
          View all
          <ArrowUpRightIcon className="size-4" />
        </Link>
      </Button>
    </div>

    <TaskRows
      tasks={tasks}
      workspaceId={workspaceId}
      limit={8}
      emptyMessage="No urgent tasks need attention."
      showReason
    />
  </section>
);

const UnassignedSection = ({
  tasks,
  workspaceId,
}: {
  tasks: DashboardTask[];
  workspaceId: string;
}) => (
  <section className="bg-card border border-border rounded-xl p-5">
    <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Unassigned</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Open tasks with no owner.
        </p>
      </div>
      <Button variant="muted" size="sm" asChild>
        <Link href={`/workspaces/${workspaceId}/tasks`}>View all</Link>
      </Button>
    </div>
    <TaskRows
      tasks={tasks}
      workspaceId={workspaceId}
      limit={5}
      emptyMessage="All open tasks have an owner."
    />
  </section>
);

const RecentlyCompletedSection = ({
  tasks,
  workspaceId,
}: {
  tasks: DashboardTask[];
  workspaceId: string;
}) => (
  <section className="bg-card border border-border rounded-xl p-5">
    <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Recently completed</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tasks marked done across the workspace.
        </p>
      </div>
    </div>
    <TaskRows
      tasks={tasks}
      workspaceId={workspaceId}
      limit={5}
      emptyMessage="No tasks have been completed yet."
    />
  </section>
);

const TaskRows = ({
  tasks,
  workspaceId,
  limit,
  emptyMessage,
  showReason,
}: {
  tasks: DashboardTask[];
  workspaceId: string;
  limit: number;
  emptyMessage: string;
  showReason?: boolean;
}) => {
  const visibleTasks = tasks.slice(0, limit);

  if (visibleTasks.length === 0) {
    return (
      <div className="px-3 py-6 rounded-lg border border-border text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-y-2.5">
      {visibleTasks.map((task) => (
        <li key={task.id}>
          <Link
            href={`/workspaces/${workspaceId}/tasks/${task.id}`}
            className="flex items-start justify-between gap-x-4 px-3 py-2.5 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {showReason && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {getAttentionReason(task)}
                  </span>
                )}
                <TaskBadge
                  variant={task.status}
                  className="px-2 py-0 text-[11px]"
                >
                  {snakeCaseToTitleCase(task.status)}
                </TaskBadge>
              </div>
              <p
                className="text-sm font-medium text-foreground line-clamp-2 mt-1.5"
                title={task.name}
              >
                {task.name}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {task.project.name}
                {task.assignee ? ` · ${getMemberName(task.assignee)}` : " · Unassigned"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-medium text-foreground">
                {formatDueDate(task)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Updated {formatDistanceToNow(new Date(task.updatedAt))} ago
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
};

const QuickActions = ({
  workspaceId,
  currentMemberId,
}: {
  workspaceId: string;
  currentMemberId?: string;
}) => {
  const { open: createTask } = useCreateTaskModal();
  const { open: createProject } = useCreateProjectModal();

  const actions = [
    {
      label: "New task",
      icon: PlusIcon,
      onClick: createTask,
    },
    {
      label: "New project",
      icon: FolderPlusIcon,
      onClick: createProject,
    },
    {
      label: "Invite member",
      icon: UserPlusIcon,
      href: `/workspaces/${workspaceId}/settings`,
    },
    {
      label: "View overdue",
      icon: AlertCircleIcon,
      href: "#needs-attention",
    },
    {
      label: "View my tasks",
      icon: UserCheckIcon,
      href: currentMemberId
        ? `/workspaces/${workspaceId}/tasks?assigneeId=${currentMemberId}`
        : `/workspaces/${workspaceId}/tasks`,
    },
  ];

  return (
    <section className="bg-card border border-border rounded-xl p-5">
      <p className="text-sm font-semibold text-foreground border-b border-border pb-4 mb-4">
        Quick actions
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const content = (
            <>
              <Icon className="size-4" />
              {action.label}
            </>
          );

          return action.href ? (
            <Button
              key={action.label}
              variant="muted"
              className="justify-start"
              asChild
            >
              <Link href={action.href}>{content}</Link>
            </Button>
          ) : (
            <Button
              key={action.label}
              variant="muted"
              className="justify-start"
              onClick={action.onClick}
            >
              {content}
            </Button>
          );
        })}
      </div>
    </section>
  );
};

const RecentActivity = ({
  items,
  workspaceId,
}: {
  items: RecentActivityItem[];
  workspaceId: string;
}) => (
  <section className="bg-card border border-border rounded-xl p-5">
    <div className="flex items-center gap-x-2 border-b border-border pb-4 mb-4">
      <ActivityIcon className="size-4 text-muted-foreground" />
      <p className="text-sm font-semibold text-foreground">Recent activity</p>
    </div>
    {items.length === 0 ? (
      <div className="px-3 py-6 rounded-lg border border-border text-center">
        <p className="text-sm text-muted-foreground">No recent updates yet.</p>
      </div>
    ) : (
      <ul className="flex flex-col gap-y-2.5">
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`}>
            <Link
              href={getActivityHref(item, workspaceId)}
              className="flex items-start gap-x-3 px-3 py-2.5 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <div className="mt-1 size-2 rounded-full bg-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.description}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(item.date)} ago
              </span>
            </Link>
          </li>
        ))}
      </ul>
    )}
  </section>
);

const ProjectHotspots = ({
  items,
  workspaceId,
}: {
  items: ProjectHotspot[];
  workspaceId: string;
}) => (
  <section className="bg-card border border-border rounded-xl p-5">
    <p className="text-sm font-semibold text-foreground border-b border-border pb-4 mb-4">
      Project hotspots
    </p>
    <ul className="flex flex-col gap-y-2.5">
      {items.map((item) => (
        <li key={item.project.id}>
          <Link
            href={`/workspaces/${workspaceId}/projects/${item.project.id}`}
            className="flex items-center justify-between gap-x-3 px-3 py-2.5 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <div className="min-w-0">
              <p
                className="text-sm font-medium text-foreground truncate"
                title={item.project.name}
              >
                {item.project.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.oldestDueDate
                  ? `Oldest due ${format(item.oldestDueDate, "MMM d")}`
                  : "Needs review"}
              </p>
            </div>
            <div className="flex items-center gap-x-2 shrink-0">
              <AlertCircleIcon className="size-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                {item.overdueCount}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  </section>
);

const getTaskGroups = (tasks: DashboardTask[], currentMemberId?: string) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const soonEnd = endOfDay(addDays(now, 7));
  const openTasks = tasks.filter(
    (task) => task.status !== TaskStatus.DONE && task.status !== TaskStatus.BACKLOG
  );
  const overdue = openTasks.filter(
    (task) => task.dueDate && isBefore(new Date(task.dueDate), todayStart)
  );
  const dueToday = openTasks.filter(
    (task) => task.dueDate && isWithinInterval(new Date(task.dueDate), {
      start: todayStart,
      end: todayEnd,
    })
  );
  const dueSoon = openTasks.filter(
    (task) =>
      task.dueDate &&
      isAfter(new Date(task.dueDate), todayEnd) &&
      isWithinInterval(new Date(task.dueDate), {
        start: todayStart,
        end: soonEnd,
      })
  );
  const myTasks = currentMemberId
    ? openTasks.filter((task) => task.assigneeId === currentMemberId)
    : [];
  const unassigned = sortByUrgency(
    openTasks.filter(
      (task) =>
        !task.assigneeId &&
        (task.status === TaskStatus.TODO || task.status === TaskStatus.IN_PROGRESS)
    )
  );
  const recentlyCompleted = sortByUpdatedAt(
    tasks.filter((task) => task.status === TaskStatus.DONE)
  ).slice(0, 10);

  const myActiveTasks = myTasks.filter(
    (task) =>
      task.status === TaskStatus.TODO || task.status === TaskStatus.IN_PROGRESS
  );
  const myOverdue = myActiveTasks.filter(
    (task) => task.dueDate && isBefore(new Date(task.dueDate), todayStart)
  );
  const myDueToday = myActiveTasks.filter(
    (task) =>
      task.dueDate &&
      isWithinInterval(new Date(task.dueDate), { start: todayStart, end: todayEnd })
  );
  const myDueSoon = myActiveTasks.filter(
    (task) =>
      task.dueDate &&
      isAfter(new Date(task.dueDate), todayEnd) &&
      isWithinInterval(new Date(task.dueDate), { start: todayStart, end: soonEnd })
  );

  const needsAttention = uniqueTasks([
    ...sortByUrgency(myOverdue),
    ...sortByUrgency(myDueToday),
    ...sortByUrgency(myDueSoon),
  ]);

  return {
    overdue: sortByUrgency(overdue),
    unassigned,
    recentlyCompleted,
    needsAttention,
  };
};

const sortByUrgency = (tasks: DashboardTask[]) =>
  [...tasks].sort((a, b) => {
    const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;

    if (aDue !== bDue) {
      return aDue - bDue;
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

const sortByUpdatedAt = (tasks: DashboardTask[]) =>
  [...tasks].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

const uniqueTasks = (tasks: DashboardTask[]) => {
  const seen = new Set<string>();
  return tasks.filter((task) => {
    if (seen.has(task.id)) {
      return false;
    }
    seen.add(task.id);
    return true;
  });
};

const getAttentionReason = (task: DashboardTask) => {
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    if (isBefore(dueDate, startOfDay(new Date()))) return "Overdue";
    if (isToday(dueDate)) return "Due today";
    return "Due soon";
  }
  return "No due date";
};

const formatDueDate = (task: DashboardTask) => {
  if (!task.dueDate) {
    return "No due date";
  }

  const dueDate = new Date(task.dueDate);

  if (isToday(dueDate)) {
    return "Due today";
  }

  return format(dueDate, "MMM d");
};

const getMemberName = (member: DashboardTask["assignee"]) =>
  member?.user.name || member?.user.email || "Unknown member";

type RecentActivityItem = {
  id: string;
  type: "task" | "project" | "member";
  title: string;
  description: string;
  date: Date;
};

const getRecentActivity = (
  tasks: DashboardTask[],
  projects: ProjectSafeDate[],
  members: DashboardMember[]
): RecentActivityItem[] => {
  const taskItems = tasks.map((task) => ({
    id: task.id,
    type: "task" as const,
    title: task.name,
    description: `Task updated in ${task.project.name}`,
    date: new Date(task.updatedAt),
  }));
  const projectItems = projects.map((project) => ({
    id: project.id,
    type: "project" as const,
    title: project.name,
    description: "Project updated",
    date: new Date(project.updatedAt),
  }));
  const memberItems = members.map((member) => ({
    id: member.id,
    type: "member" as const,
    title: member.user.name || member.user.email,
    description: "Member joined the workspace",
    date: new Date(member.createdAt),
  }));

  return [...taskItems, ...projectItems, ...memberItems]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6);
};

const getActivityHref = (item: RecentActivityItem, workspaceId: string) => {
  if (item.type === "task") {
    return `/workspaces/${workspaceId}/tasks/${item.id}`;
  }

  if (item.type === "project") {
    return `/workspaces/${workspaceId}/projects/${item.id}`;
  }

  return `/workspaces/${workspaceId}/members/${item.id}`;
};

type ProjectHotspot = {
  project: ProjectSafeDate;
  overdueCount: number;
  oldestDueDate: Date | null;
};

const getProjectHotspots = (
  projects: ProjectSafeDate[],
  overdueTasks: DashboardTask[]
): ProjectHotspot[] => {
  return projects
    .map((project) => {
      const projectOverdue = overdueTasks.filter(
        (task) => task.projectId === project.id
      );
      const oldestDueDate = projectOverdue
        .map((task) => (task.dueDate ? new Date(task.dueDate) : null))
        .filter(Boolean)
        .sort((a, b) => a!.getTime() - b!.getTime())[0] ?? null;

      return {
        project,
        overdueCount: projectOverdue.length,
        oldestDueDate,
      };
    })
    .filter((item) => item.overdueCount > 0)
    .sort((a, b) => b.overdueCount - a.overdueCount)
    .slice(0, 4);
};

export default WorkspaceIdClient;
