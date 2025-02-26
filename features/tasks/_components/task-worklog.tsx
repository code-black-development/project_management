import DottedSeparator from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import { TaskWithUser } from "@/types/types";
import { PlusIcon } from "lucide-react";
import useCreateTaskWorklogModal from "../hooks/use-create-task-worklog-modal";
import { Progress } from "@/components/ui/progress";
import { timeEstimateStringToMinutes } from "@/lib/utils";
import ProgressBar from "@/components/progress-bar";

interface TaskWorklogProps {
  task: TaskWithUser;
}

const TaskWorklog = ({ task }: TaskWorklogProps) => {
  const { open } = useCreateTaskWorklogModal();
  const estimateInMinutes = task.timeEstimate
    ? timeEstimateStringToMinutes(task.timeEstimate)
    : 0;

  let worklogTotal = 0;
  if (task.worklogs.length > 0) {
    task.worklogs.map((worklog) => {
      worklogTotal += worklog.timeSpent;
    });
  }
  const progressValue =
    estimateInMinutes > 0 ? (worklogTotal / estimateInMinutes) * 100 : 0;

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <p className="tetx-lg font-semibold">Worklogs</p>
        <Button size="sm" variant="secondary" onClick={() => open(task.id)}>
          <PlusIcon className="size-4 mr-2" />
        </Button>
      </div>
      <DottedSeparator className="my-4" />
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col  justify-between">
          <p className="font-medium">Original Estimated Time:</p>
          {task.timeEstimate || <span>--</span>}
        </div>
        <div className="flex flex-col">
          <p className="font-medium">Total Time Logged:</p>
          {worklogTotal}
        </div>
      </div>
      <div className="flex flex-col gap-8 pt-4 my-4">
        <p>Task Progress</p>
        <ProgressBar progress={worklogTotal} />
      </div>
    </div>
  );
};

export default TaskWorklog;
