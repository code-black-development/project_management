"use client";

import { useGetProject } from "@/features/projects/api/use-get-project";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import ProjectForm from "@/features/projects/_components/project-form";
import PageLoader from "@/components/page-loader";
import PageError from "@/components/page-error";

const ProjectIdSettingsClient = () => {
  const projectId = useProjectId();
  const { data: project, isLoading } = useGetProject({ projectId });

  if (isLoading) {
    return <PageLoader />;
  }
  if (!project) {
    return <PageError message="Project not found" />;
  }

  return (
    <div className="w-full lg:max-w-xl">
      <ProjectForm initialValues={project} />
    </div>
  );
};

export default ProjectIdSettingsClient;
