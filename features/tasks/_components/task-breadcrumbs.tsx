import { Button } from "@/components/ui/button";
import ProjectAvatar from "@/features/projects/_components/project-avatar";
import { ProjectSafeDate, TaskWithUser } from "@/types/types";
import { ChevronsRightIcon, TrashIcon } from "lucide-react";
import Link from "next/link";

interface TaskBreadcrumbsProps {
  project: ProjectSafeDate;
  task: TaskWithUser;
}

const TaskBreadcrumbs = ({ project, task }: TaskBreadcrumbsProps) => {
  return (
    <div className="flex items-center gap-x-2">
      <ProjectAvatar
        image={project.image ?? undefined}
        name={project.name}
        className="size-6 lg:size-8"
      />
      <Link href={`/workspaces/${project.workspaceId}/projects/${project.id}`}>
        <p className="text-sm lg:text-lg font-semibold text-muted-foreground hover:opacity-75 transition">
          {project.name}
        </p>
      </Link>
      <ChevronsRightIcon className="size-4 lg:size-5 text-muted-foreground" />
      <p>{task.name}</p>
      <Button variant="destructive" size="sm" className="flex items-center">
        <TrashIcon className="size-4 lg:mr-2" />
        <span className="hidden lg:block">Delete Task</span>
      </Button>
    </div>
  );
};

export default TaskBreadcrumbs;
