import MemberAvatar from "@/features/members/_components/member-avatar";
import ProjectAvatar from "@/features/projects/_components/project-avatar";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { cn } from "@/lib/utils";
import { MemberSafeDate, ProjectSafeDate, UserSafeDate } from "@/types/types";
import { TaskStatus } from "@prisma/client";
import { useRouter } from "next/navigation";

interface EventCardProps {
  id: string;
  title: string;
  assignee?: MemberSafeDate & { user: UserSafeDate };
  project: ProjectSafeDate;
  status: string;
}

const statusColorMap: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: "border-l-pink-500",
  [TaskStatus.TODO]: "border-l-red-500",
  [TaskStatus.IN_PROGRESS]: "border-l-yellow-500",
  [TaskStatus.IN_REVIEW]: "border-l-blue-500",
  [TaskStatus.DONE]: "border-l-emerald-500",
};

const EventCard = ({
  id,
  title,
  assignee,
  project,
  status,
}: EventCardProps) => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    router.push(`/workspaces/${workspaceId}/tasks/${id}`);
  };
  return (
    <div className="px-2">
      <div
        onClick={onClick}
        className={cn(
          "p-1.5 text-xs bg-whiyte text-primary border rounded-md border-l-4 flex flex-col gap-y-1.5 cursor-pointer hover:opacity-75 transition",
          statusColorMap[status as TaskStatus]
        )}
      >
        <p>{title}</p>
        <div className="flex items-center gap-x-1">
          <MemberAvatar
            name={(assignee?.user?.name ?? assignee?.user.name) || "unassigned"}
            image={assignee?.user?.image || undefined}
          />
          <div className="size-1 rounded-full bg-neutral-300" />
          <ProjectAvatar
            name={project.name}
            image={project?.image ?? undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default EventCard;
