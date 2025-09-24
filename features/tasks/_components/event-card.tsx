import MemberAvatar from "@/features/members/_components/member-avatar";
import ProjectAvatar from "@/features/projects/_components/project-avatar";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useDeleteEvent } from "../api/use-delete-event";
import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";
import { MemberSafeDate, ProjectSafeDate, UserSafeDate } from "@/types/types";
import { TaskStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventCardProps {
  id: string;
  title: string;
  assignee?: MemberSafeDate & { user: UserSafeDate };
  project: ProjectSafeDate;
  status: string;
  type?: "task" | "event";
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
  type = "task",
}: EventCardProps) => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const { mutate: deleteEvent, isPending: isDeletingEvent } = useDeleteEvent();
  const [ConfirmDialog, confirm] = useConfirm(
    "Delete Event",
    "This will permanently delete this event and all its occurrences. This action cannot be undone.",
    "destructive"
  );

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    router.push(`/workspaces/${workspaceId}/tasks/${id}`);
  };

  const onDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent card click navigation

    const ok = await confirm();
    if (!ok) return;

    deleteEvent({
      param: { eventId: id },
    });
  };

  const bgColor =
    type === "event" ? "bg-purple-50 dark:bg-gray-800" : "bg-white dark:bg-gray-800";
  const borderStyle =
    type === "event"
      ? "border-purple-500"
      : statusColorMap[status as TaskStatus];

  return (
    <>
      <ConfirmDialog />
      <div className="px-2">
        <div
          onClick={onClick}
          className={cn(
            "p-1.5 text-xs text-primary border rounded-md border-l-4 flex flex-col gap-y-1.5 cursor-pointer hover:opacity-75 transition",
            bgColor,
            borderStyle
          )}
        >
          <div className="flex items-center justify-between">
            <p>{title}</p>
            <div className="flex items-center gap-x-1">
              {type === "event" && (
                <>
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-1 rounded">
                    Event
                  </span>
                  <Button
                    onClick={onDelete}
                    disabled={isDeletingEvent}
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-x-1">
            <MemberAvatar
              name={
                (assignee?.user?.name ?? assignee?.user.name) || "unassigned"
              }
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
    </>
  );
};

export default EventCard;
