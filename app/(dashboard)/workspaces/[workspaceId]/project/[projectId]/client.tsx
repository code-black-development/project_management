"use client";

import PageError from "@/components/page-error";
import PageLoader from "@/components/page-loader";
import { Button } from "@/components/ui/button";
import ProjectAvatar from "@/features/projects/_components/project-avatar";
import { useGetProject } from "@/features/projects/api/use-get-project";
import useGetProjectAnalytics from "@/features/projects/api/use-get-project-analytics";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import Analytics from "@/features/tasks/_components/analytics";
import TaskViewSwitcher from "@/features/tasks/_components/task-view-switcher";
import { PencilIcon } from "lucide-react";
import Link from "next/link";

const ProjectIdClient = () => {
  const projectId = useProjectId();

  const { data: project, isLoading: isLoadingProject } = useGetProject({
    projectId,
  });

  const { data: analytics, isLoading: isLoadingAnalytics } =
    useGetProjectAnalytics({ projectId });

  const isLoading = isLoadingProject || isLoadingAnalytics;

  if (isLoading) return <PageLoader />;

  if (!project) return <PageError message="Project not found" />;

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <ProjectAvatar
            image={project.image || undefined}
            name={project.name}
            className="size-8"
          />
          <p className="text-lg font-semibold">{project.name}</p>
        </div>
        <div className="">
          <Button variant="secondary" size="sm" asChild>
            <Link
              href={`/workspaces/${project.workspaceId}/project/${project.id}/settings`}
            >
              <PencilIcon />
              Edit project
            </Link>
          </Button>
        </div>
      </div>
      {analytics && <Analytics data={analytics} />}
      <TaskViewSwitcher hideProjectFilter={true} />
    </div>
  );
};

export default ProjectIdClient;
