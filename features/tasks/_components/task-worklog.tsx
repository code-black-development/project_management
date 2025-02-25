import DottedSeparator from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import { TaskWithUser } from "@/types/types";
import { PlusIcon } from "lucide-react";
import useCreateTaskWorklogModal from "../hooks/use-create-task-worklog-modal";

interface TaskWorklogProps {
  task: TaskWithUser;
}

const TaskWorklog = ({ task }: TaskWorklogProps) => {
  const { open } = useCreateTaskWorklogModal();
  let worklogTotal = 0;
  if (task.worklogs.length > 0) {
    task.worklogs.map((worklog) => {
      worklogTotal += worklog.timeSpent;
    });
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <p className="tetx-lg font-semibold">Worklogs</p>
        <Button size="sm" variant="secondary" onClick={() => open()}>
          <PlusIcon className="size-4 mr-2" />
        </Button>
      </div>
      <DottedSeparator className="my-4" />

      <div>{task.timeEstimate || <span>No description</span>}</div>
    </div>
  );
};

export default TaskWorklog;
