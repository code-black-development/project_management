import { Button } from "@/components/ui/button";
import ProjectAvatar from "@/features/projects/_components/project-avatar";
import TaskViewSwitcher from "@/features/tasks/_components/task-view-switcher";
import { getProjectById } from "@/lib/dbService/projects";
import { PencilIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

interface ProjectIdPageProps {
  params: {
    projectId: string;
  };
}

const ProjectIdPage = async ({ params }: ProjectIdPageProps) => {
  const { projectId } = await params;
  //we should check that the user is a member of the relevant workspace
  const project = await getProjectById(projectId);
  if (!project) {
    redirect("/404");
  }
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
      <TaskViewSwitcher projectId={projectId} />
    </div>
  );
};

export default ProjectIdPage;
