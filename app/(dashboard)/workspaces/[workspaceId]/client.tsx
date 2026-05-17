"use client";

import PageError from "@/components/page-error";
import PageLoader from "@/components/page-loader";
import { Button } from "@/components/ui/button";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import useCreateProjectModal from "@/features/projects/hooks/use-create-project-modal";
import Analytics from "@/features/tasks/_components/analytics";
import { useGetTasks } from "@/features/tasks/api/use-get-tasks";
import useCreateTaskModal from "@/features/tasks/hooks/use-create-task-modal";
import useGetWorkspaceAnalytics from "@/features/workspaces/api/use-get-workspace-analytics";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import {
  MemberSafeDate,
  ProjectSafeDate,
  TaskWithUser,
  UserSafeDate,
} from "@/types/types";
import { PlusIcon, CalendarIcon, SettingsIcon } from "lucide-react";

import { formatDistanceToNow } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";

import Link from "next/link";
import ProjectAvatar from "@/features/projects/_components/project-avatar";
import MemberAvatar from "@/features/members/_components/member-avatar";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";

const WorkspaceIdClient = () => {
  const workspaceId = useWorkspaceId();
  const { data: session } = useSession();
  const { data: workspacesData } = useGetWorkspaces();

  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const workspaceName =
    workspacesData?.data?.find((w) => w.id === workspaceId)?.name ||
    "your workspace";

  const { data: analytics, isLoading: isLoadingAnalytics } =
    useGetWorkspaceAnalytics({ workspaceId });

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

  if (
    isLoadingAnalytics ||
    isLoadingMembers ||
    isLoadingProjects ||
    isLoadingTasks
  ) {
    return <PageLoader />;
  }

  if (!analytics || !members || !projects || !tasks) {
    return <PageError message="Failed to fetch workspace data" />;
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex flex-col gap-y-1 mb-4">
        <h1 className="text-[30px] font-bold leading-tight tracking-tight text-foreground">
          Hi {firstName}
        </h1>
        <p className="text-[16px] text-muted-foreground leading-relaxed">
          Here&apos;s your workspace overview for{" "}
          <span className="text-foreground font-medium">{workspaceName}</span>.
        </p>
      </div>
      <Analytics data={analytics} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <TaskList data={tasks} />
        <ProjectList data={projects} />
        <MemberList data={members.data} />
      </div>
    </div>
  );
};

const panelClass =
  "col-span-1 bg-muted border border-border rounded-xl p-5";

const sectionHeaderClass =
  "flex items-center justify-between border-b border-border pb-4 mb-4";

interface TaskListProps {
  data: Omit<TaskWithUser, "children">[];
}
export const TaskList = ({ data }: TaskListProps) => {
  const workspaceId = useWorkspaceId();
  const { open: createTask } = useCreateTaskModal();

  return (
    <div className={panelClass}>
      <div className={sectionHeaderClass}>
        <p className="text-base font-semibold">Tasks {data.length || 0}</p>
        <Button variant="muted" size="icon" onClick={createTask}>
          <PlusIcon className="size-4" />
        </Button>
      </div>
      <ul className="flex flex-col gap-y-2.5">
        {data.map((task) => (
          <li key={task.id}>
            <Link href={`/workspaces/${workspaceId}/tasks/${task.id}`}>
              <Card className="shadow-none rounded-xl border border-border hover:bg-accent transition-colors dark:border-border dark:hover:bg-card-hover">
                <CardContent className="p-4">
                  <p
                    className="text-sm font-medium text-foreground line-clamp-2"
                    title={task.name}
                  >
                    {task.name}
                  </p>
                  <div className="flex items-center gap-x-2 mt-1.5">
                    <p className="text-xs text-muted-foreground truncate">
                      {task.project.name}
                    </p>
                    <div className="size-1 rounded-full bg-border shrink-0" />
                    <div className="text-xs text-muted-foreground flex items-center gap-x-1 shrink-0">
                      <CalendarIcon className="size-3" />
                      <span>
                        {task.dueDate
                          ? formatDistanceToNow(new Date(task.dueDate))
                          : "No due date"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
        <li className="text-sm text-muted-foreground text-center hidden first-of-type:block">
          No tasks found
        </li>
      </ul>
      <div className="mt-4">
        <Button variant="muted" className="w-full" asChild>
          <Link href={`/workspaces/${workspaceId}/tasks`}>Show all</Link>
        </Button>
      </div>
    </div>
  );
};

interface ProjectListProps {
  data: ProjectSafeDate[];
}
export const ProjectList = ({ data }: ProjectListProps) => {
  const workspaceId = useWorkspaceId();
  const { open: createProject } = useCreateProjectModal();

  return (
    <div className={panelClass}>
      <div className={sectionHeaderClass}>
        <p className="text-base font-semibold">Projects {data.length || 0}</p>
        <Button variant="muted" size="icon" onClick={createProject}>
          <PlusIcon className="size-4" />
        </Button>
      </div>
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {data.map((project) => (
          <li key={project.id}>
            <Link href={`/workspaces/${workspaceId}/projects/${project.id}`}>
              <Card className="shadow-none rounded-xl border border-border hover:bg-accent transition-colors dark:border-border dark:hover:bg-card-hover">
                <CardContent className="p-4 flex items-center gap-x-3">
                  <div className="size-11 shrink-0">
                    <ProjectAvatar
                      name={project.name}
                      image={project.image || undefined}
                      className="size-11 rounded-lg"
                      fallbackClassName="text-base rounded-lg"
                    />
                  </div>
                  <p
                    className="text-sm font-medium text-foreground line-clamp-2"
                    title={project.name}
                  >
                    {project.name}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
        <li className="text-sm text-muted-foreground text-center hidden first-of-type:block">
          No projects found
        </li>
      </ul>
    </div>
  );
};

interface MemberListProps {
  data: (MemberSafeDate & { user: UserSafeDate })[];
}
export const MemberList = ({ data }: MemberListProps) => {
  const workspaceId = useWorkspaceId();

  return (
    <div className={panelClass}>
      <div className={sectionHeaderClass}>
        <p className="text-base font-semibold">Members {data.length || 0}</p>
        <Button variant="muted" size="icon" asChild>
          <Link href={`/workspaces/${workspaceId}/members`}>
            <SettingsIcon className="size-4" />
          </Link>
        </Button>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data?.map((member) => (
          <li key={member.id}>
            <Card className="shadow-none rounded-xl border border-border dark:border-border">
              <CardContent className="p-3 flex flex-col items-center gap-y-2">
                <MemberAvatar
                  name={member.user.name ?? member.user.email}
                  image={member.user.image || undefined}
                  className="size-11"
                  fallbackClassName="text-base"
                />
                <div className="flex flex-col items-center overflow-hidden w-full">
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {member.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {member.user.email}
                  </p>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
        <li className="text-sm text-muted-foreground text-center hidden first-of-type:block">
          No members found
        </li>
      </ul>
    </div>
  );
};

export default WorkspaceIdClient;
