import { useState } from "react";
import { PencilIcon, XIcon } from "lucide-react";
import { TaskWithUser } from "@/types/types";
import { useUpdateTask } from "../api/use-update-task";
import { Button } from "@/components/ui/button";
import DottedSeparator from "@/components/dotted-separator";
import { Textarea } from "@/components/ui/textarea";

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

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <p className="tetx-lg font-semibold">Description</p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setIsEditing((prev) => !prev)}
        >
          {isEditing ? (
            <XIcon className="size-4 mr-2" />
          ) : (
            <PencilIcon className="size-4 mr-2" />
          )}
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </div>
      <DottedSeparator className="my-4" />
      {isEditing ? (
        <div className="flex flex-col gap-y-4">
          <Textarea
            placeholder="Add a task description"
            value={value}
            rows={4}
            onChange={(e) => setValue(e.target.value)}
            disabled={isPending}
          />
          <Button
            size="sm"
            className="w-fit ml-auto"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      ) : (
        <div>{task.description || <span>No description</span>}</div>
      )}
    </div>
  );
};

export default TaskDescription;
