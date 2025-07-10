"use client";

import DottedSeparator from "@/components/dotted-separator";
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

const WorkspaceIdClient = () => {
  const workspaceId = useWorkspaceId();
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
      <Analytics data={analytics} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <TaskList data={tasks} />
        <ProjectList data={projects} />
        <MemberList data={members.data} />
      </div>
    </div>
  );
};

interface TaskListProps {
  data: Omit<TaskWithUser, "children">[];
}
export const TaskList = ({ data }: TaskListProps) => {
  const workspaceId = useWorkspaceId();

  const { open: createTask } = useCreateTaskModal();

  return (
    <div className="flex flex-col agp-y-4 col-span-1">
      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Tasks {data.length || 0}</p>
          <Button variant="muted" size="icon" onClick={createTask}>
            <PlusIcon className="size-4 text-neutral-400" />
          </Button>
        </div>

        <DottedSeparator className="my-4" />
        <ul className="flex flex-col gap-y-4">
          {data.map((task) => (
            <li key={task.id}>
              <Link href={`/workspaces/${workspaceId}/tasks/${task.id}`}>
                <Card className="shadow-none rounded-lg hover:opcaity-75 transition">
                  <CardContent className="p-4">
                    <p className="text-lg font-medium truncate">{task.name}</p>
                    <div className="flex items-center gap-x-2">
                      <p>{task.project.name}</p>
                      <div className="size-1 rounded-full bg-neutral-300" />
                      <div className="text-sm text-muted-foreground flex items-center">
                        <CalendarIcon className="size-3 mr-1" />
                        <span className="truncate">
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
        <div className="mt-4 flex justify-center">
          <Button variant="muted" className="w-full" asChild>
            <Link href={`/workspaces/${workspaceId}/tasks`}>Show all</Link>
          </Button>
        </div>
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
    <div className="flex flex-col agp-y-4 col-span-1">
      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Projects {data.length || 0}</p>
          <Button variant="muted" size="icon" onClick={createProject}>
            <PlusIcon className="size-4 text-neutral-400" />
          </Button>
        </div>

        <DottedSeparator className="my-4" />
        <ul className="grid grid-cols-1 lg:grid-cols-2  gap-4">
          {data.map((project) => (
            <li key={project.id}>
              <Link href={`/workspaces/${workspaceId}/projects/${project.id}`}>
                <Card className="shadow-none rounded-lg hover:opcaity-75 transition">
                  <CardContent className="p-4 flex items-center gap-x-2.5">
                    <ProjectAvatar
                      name={project.name}
                      image={project.image || undefined}
                      className="size-12"
                      fallbackClassName="text-lg"
                    />
                    <p className="text-lg font-medium truncate">
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
    </div>
  );
};

interface MemberListProps {
  data: (MemberSafeDate & { user: UserSafeDate })[];
}
export const MemberList = ({ data }: MemberListProps) => {
  const workspaceId = useWorkspaceId();

  return (
    <div className="flex flex-col agp-y-4 col-span-1">
      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Members {data.length || 0}</p>
          <Button variant="muted" size="icon" asChild>
            <Link href={`/workspaces/${workspaceId}/members`}>
              <SettingsIcon className="size-4 text-neutral-400" />
            </Link>
          </Button>
        </div>

        <DottedSeparator className="my-4" />
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-4">
          {data?.map((member) => (
            <li key={member.id}>
              <Card className="shadow-none rounded-lg overflow-hidden">
                <CardContent className="p-3 flex flex-col items-center gap-x-2">
                  <MemberAvatar
                    name={member.user.name ?? member.user.email}
                    image={member.user.image || undefined}
                    className="size-12"
                    fallbackClassName="text-lg"
                  />
                  <div className="flex flex-col items-center overflow-hidden">
                    <p className="text-lg font-medium line-clamp-1">
                      {member.user.name}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
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
    </div>
  );
};

export default WorkspaceIdClient;
