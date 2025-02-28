import { Button } from "@/components/ui/button";
import ProjectAvatar from "@/features/projects/_components/project-avatar";
import { useConfirm } from "@/hooks/use-confirm";
import { ProjectSafeDate, TaskWithUser } from "@/types/types";
import { ChevronRightIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { useDeleteTask } from "../api/use-delete-task";
import { useRouter } from "next/navigation";

interface TaskBreadcrumbsProps {
  project: ProjectSafeDate;
  task: TaskWithUser;
}

const TaskBreadcrumbs = ({ project, task }: TaskBreadcrumbsProps) => {
  const { mutate: deleteTask, isPending } = useDeleteTask();
  const router = useRouter();
  const [ConfirmDialog, confirm] = useConfirm(
    "Delete Task",
    "This action cannot be undone",
    "destructive"
  );

  const handelDeleteTask = async () => {
    const ok = await confirm();
    if (!ok) return;
    deleteTask(
      { param: { taskId: task.id } },
      {
        onSuccess: () => {
          router.push(`/workspaces/${project.workspaceId}/tasks/`);
        },
      }
    );
  };

  return (
    <div className="flex items-center gap-x-2">
      <ConfirmDialog />
      <ProjectAvatar
        image={project.image ?? undefined}
        name={project.name}
        className="size-6 lg:size-8"
      />
      <Link href={`/workspaces/${project.workspaceId}/project/${project.id}`}>
        <p className="text-sm lg:text-lg font-semibold text-muted-foreground hover:opacity-75 transition">
          {project.name}
        </p>
      </Link>
      <ChevronRightIcon className="size-4 lg:size-5 text-muted-foreground" />
      <p>{task.name}</p>

      <Button
        variant="destructive"
        size="sm"
        className="flex items-center ml-auto"
        onClick={handelDeleteTask}
        disabled={isPending}
      >
        <TrashIcon className="size-4 lg:mr-2" />
        <span className="hidden lg:block">Delete Task</span>
      </Button>
    </div>
  );
};

export default TaskBreadcrumbs;
