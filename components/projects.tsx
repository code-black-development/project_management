"use client";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { usePathname } from "next/navigation";
import { RiAddCircleFill } from "react-icons/ri";
import Link from "next/link";
import { cn } from "@/lib/utils";
import useCreateProjectModal from "@/features/projects/hooks/use-create-project-modal";
import ProjectAvatar from "@/features/projects/_components/project-avatar";

const Projects = () => {
  const workspaceId = useWorkspaceId();
  const { data } = useGetProjects({ workspaceId });
  const pathname = usePathname();
  const { open } = useCreateProjectModal();
  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase text-neutral-500 dark:text-neutral-200">
          Projects
        </p>
        <RiAddCircleFill
          className="size-5 text-neutral-500 cursor-pointer hover:opacity-75 transition"
          onClick={open}
        />
      </div>
      <div className="flex flex-col">
        {data?.map((project) => {
          const href = `/workspaces/${workspaceId}/project/${project.id}`;
          const isActive = pathname === href;
          return (
            <Link href={href} key={project.id}>
              <div
                className={cn(
                  "flex items-center gap-2.5 p-1.5 rounded-md cursor-pointer hover:opcaity-75 transition text-neutral-500 dark:text-neutral-200",
                  isActive &&
                    "bg-white dark:bg-neutral-600 shadow-sm hover:opacity-100 text-primary"
                )}
              >
                <ProjectAvatar
                  image={project.image || undefined}
                  name={project.name}
                />
                <span className="truncate">{project.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Projects;
