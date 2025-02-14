import ProjectForm from "@/features/projects/_components/create-project-form";
import { getProjectById } from "@/lib/dbService/projects";

interface ProjectSettingsPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

const ProjectSettingsPage = async ({ params }: ProjectSettingsPageProps) => {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  return (
    <div className="w-full lg:max-w-xl">
      <ProjectForm initialValues={project || undefined} />
    </div>
  );
};

export default ProjectSettingsPage;
