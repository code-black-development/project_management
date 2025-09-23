import DottedSeparator from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskWithUser } from "@/types/types";
import { PencilIcon, Trash2, CopyIcon, ExternalLinkIcon } from "lucide-react";
import TaskOverviewProperty from "./task-overview-property";
import MemberAvatar from "@/features/members/_components/member-avatar";
import TaskDate from "./task-date";
import { TaskBadge } from "./task-badge";
import { snakeCaseToTitleCase } from "@/lib/utils";
import useEditTaskModal from "../hooks/use-edit-task-modal";
import { useDeleteEvent } from "../api/use-delete-event";
import { useCloneTask } from "../api/use-clone-task";
import { useConfirm } from "@/hooks/use-confirm";
import { useRouter } from "next/navigation";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import TaskChildren from "./task-children";
import { TaskType } from "@prisma/client";
import Link from "next/link";

import DynamicIcon from "@/components/dynamic-icon";

interface TaskOverviewProps {
  task: TaskWithUser;
}

const TaskOverview = ({ task }: TaskOverviewProps) => {
  const { open } = useEditTaskModal();
  const { mutate: deleteEvent, isPending: isDeletingEvent } = useDeleteEvent();
  const { mutate: cloneTask, isPending: isCloningTask } = useCloneTask();
  const [ConfirmDialog, confirm] = useConfirm(
    "Delete Event",
    "This will permanently delete this event and all its occurrences. This action cannot be undone.",
    "destructive"
  );
  const router = useRouter();
  const workspaceId = useWorkspaceId();

  const onDelete = async () => {
    const ok = await confirm();
    if (!ok) return;

    deleteEvent(
      { param: { eventId: task.id } },
      {
        onSuccess: () => {
          router.push(`/workspaces/${workspaceId}/tasks`);
        },
      }
    );
  };

  const onClone = () => {
    cloneTask({ taskId: task.id });
  };

  const isEvent = task.taskType === TaskType.EVENT;

  return (
    <>
      <ConfirmDialog />
      <div className="flex flex-col gap-y-4 col-span-1">
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">Overview</p>
            <div className="flex items-center gap-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => open(task.id)}
              >
                <PencilIcon className="size-4 mr-2" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onClone}
                disabled={isCloningTask}
              >
                <CopyIcon className="size-4 mr-2" />
                Clone
              </Button>
              {isEvent && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onDelete}
                  disabled={isDeletingEvent}
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete Event
                </Button>
              )}
            </div>
          </div>
          <DottedSeparator className="my-4" />
          <div className="flex flex-col gap-y-4">
            <TaskOverviewProperty label="Assignee">
              <MemberAvatar
                name={
                  (task.assignee?.user.name ?? task.assignee?.user.name) ||
                  undefined
                }
                image={task.assignee?.user.image || undefined}
                className="size-6"
              />
              <p className="text-sm font-medium">
                {(task.assignee?.user.name ?? task.assignee?.user.email) ||
                  "unassigned"}
              </p>
            </TaskOverviewProperty>
            <TaskOverviewProperty label="Created By">
              <MemberAvatar
                name={task.createdBy?.user.name || undefined}
                image={task.createdBy?.user.image || undefined}
                className="size-6"
              />
              <p className="text-sm font-medium">
                {task.createdBy?.user.name ||
                  task.createdBy?.user.email ||
                  "Unknown"}
              </p>
            </TaskOverviewProperty>

            {task.parent && (
              <TaskOverviewProperty label="Parent Task">
                <Link
                  href={`/workspaces/${workspaceId}/tasks/${task.parent.id}`}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ExternalLinkIcon className="size-4" />
                  <span>{task.parent.name}</span>
                </Link>
              </TaskOverviewProperty>
            )}

            <TaskOverviewProperty label="Due Date">
              {task.dueDate ? (
                <TaskDate
                  value={task.dueDate}
                  className="text-sm font-medium"
                />
              ) : (
                <span className="text-sm font-medium text-muted-foreground">
                  No due date
                </span>
              )}
            </TaskOverviewProperty>
            <TaskOverviewProperty label="Status">
              <TaskBadge variant={task.status}>
                {snakeCaseToTitleCase(task.status)}
              </TaskBadge>
            </TaskOverviewProperty>

            <TaskOverviewProperty label="Type">
              <Badge
                variant="outline"
                className={
                  isEvent
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : ""
                }
              >
                {isEvent ? "Event" : "Task"}
              </Badge>
            </TaskOverviewProperty>

            <TaskOverviewProperty label="Category">
              {task.category ? (
                <Badge variant="outline" className="gap-x-2">
                  <DynamicIcon
                    iconName={task.category.icon || "tag"}
                    className="size-4"
                  />
                  <p className="text-sm font-medium">{task.category.name}</p>
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-x-2">
                  <p className="text-sm font-medium">-</p>
                </Badge>
              )}
            </TaskOverviewProperty>

            {isEvent && task.isRecurring && (
              <>
                <TaskOverviewProperty label="Recurrence">
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {task.recurrenceFrequency &&
                      snakeCaseToTitleCase(task.recurrenceFrequency)}
                  </Badge>
                </TaskOverviewProperty>

                <TaskOverviewProperty label="Duration">
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    {task.recurrenceDuration &&
                      snakeCaseToTitleCase(task.recurrenceDuration)}
                  </Badge>
                </TaskOverviewProperty>

                {task.recurrenceEndDate && (
                  <TaskOverviewProperty label="Ends On">
                    <TaskDate value={task.recurrenceEndDate} />
                  </TaskOverviewProperty>
                )}
              </>
            )}
          </div>
          <DottedSeparator className="my-4" />
          <TaskChildren
            taskId={task.id}
            projectId={task.projectId}
            workspaceId={task.workspaceId}
            tasks={task.children}
          />
        </div>
      </div>
    </>
  );
};

export default TaskOverview;
