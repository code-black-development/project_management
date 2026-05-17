import { useState } from "react";
import { PencilIcon, XIcon, AlignLeftIcon } from "lucide-react";
import { TaskWithUser } from "@/types/types";
import { useUpdateTask } from "../api/use-update-task";
import { Button } from "@/components/ui/button";
import { Editor } from "@/components/editor";
import { Preview } from "@/components/preview";

interface TaskDescriptionProps {
  task: TaskWithUser;
}

const TaskDescription = ({ task }: TaskDescriptionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(task.description ?? "");

  const { mutate: updateTaskDescription, isPending } = useUpdateTask();

  const handleSave = async () => {
    updateTaskDescription(
      {
        param: { taskId: task.id },
        json: { description: value },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const hasDescription = task.description && task.description.trim().length > 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
        <p className="text-sm font-semibold text-foreground">Description</p>
        <Button
          size="sm"
          variant="muted"
          onClick={() => setIsEditing((prev) => !prev)}
        >
          {isEditing ? (
            <>
              <XIcon className="size-3.5 mr-1.5" />
              Cancel
            </>
          ) : (
            <>
              <PencilIcon className="size-3.5 mr-1.5" />
              Edit
            </>
          )}
        </Button>
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-y-3">
          <Editor value={value} onChange={(e) => setValue(e)} />
          <Button
            size="sm"
            variant="muted"
            className="w-fit ml-auto"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      ) : hasDescription ? (
        <Preview value={value} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-y-1.5 py-6 text-center">
          <AlignLeftIcon className="size-7 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No description</p>
          <p className="text-xs text-muted-foreground/70">
            Add context, acceptance criteria, or notes for this task.
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskDescription;
