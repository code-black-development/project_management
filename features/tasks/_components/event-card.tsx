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
  hideProjectInfo?: boolean;
}

const statusAccentMap: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: "border-l-pink-400 dark:border-l-pink-500",
  [TaskStatus.TODO]: "border-l-red-400 dark:border-l-red-500",
  [TaskStatus.IN_PROGRESS]: "border-l-yellow-400 dark:border-l-yellow-500",
  [TaskStatus.IN_REVIEW]: "border-l-blue-400 dark:border-l-blue-500",
  [TaskStatus.DONE]: "border-l-emerald-400 dark:border-l-emerald-500",
};

const EventCard = ({
  id,
  title,
  assignee,
  project,
  status,
  type = "task",
  hideProjectInfo,
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

  const borderAccent =
    type === "event"
      ? "border-l-purple-400 dark:border-l-purple-500"
      : statusAccentMap[status as TaskStatus];

  return (
    <>
      <ConfirmDialog />
      <div className="px-2 pb-0.5">
        <div
          onClick={onClick}
          className={cn(
            "p-1.5 text-xs bg-card border border-border border-l-4 rounded-md flex flex-col gap-y-1 cursor-pointer hover:bg-accent transition-colors",
            borderAccent
          )}
        >
          <div className="flex items-start justify-between gap-x-1">
            <p className="text-foreground font-medium leading-snug line-clamp-2">
              {title}
            </p>
            {type === "event" && (
              <Button
                onClick={onDelete}
                disabled={isDeletingEvent}
                variant="ghost"
                size="sm"
                className="h-auto p-0.5 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          {(!hideProjectInfo || type === "event") && (
            <div className="flex items-center gap-x-1.5">
              {!hideProjectInfo && (
                <>
                  <ProjectAvatar
                    name={project.name}
                    image={project?.image ?? undefined}
                    className="size-3.5"
                    fallbackClassName="text-[8px]"
                  />
                  <span className="text-muted-foreground truncate">{project.name}</span>
                </>
              )}
              {type === "event" && (
                <span className={cn(!hideProjectInfo && "ml-auto", "text-purple-500 dark:text-purple-400 shrink-0")}>Event</span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EventCard;
