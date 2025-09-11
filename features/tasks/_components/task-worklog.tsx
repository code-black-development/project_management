import DottedSeparator from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import { TaskWithUser } from "@/types/types";
import { PlusIcon } from "lucide-react";
import useCreateTaskWorklogModal from "../hooks/use-create-task-worklog-modal";
import {
  timeEstimateStringToMinutes,
  minutesToTimeEstimateString,
} from "@/lib/utils";
import ProgressBar from "@/components/progress-bar";
import MemberAvatar from "@/features/members/_components/member-avatar";

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
    estimateInMinutes > 0
      ? Math.round((worklogTotal / estimateInMinutes) * 100)
      : 0;

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
          {minutesToTimeEstimateString(worklogTotal)}
        </div>
      </div>
      <div className="flex flex-col gap-8 pt-4 my-4">
        <p>Task Progress</p>
        <ProgressBar progress={progressValue} />
      </div>

      {/* Worklog List */}
      {task.worklogs.length > 0 && (
        <>
          <DottedSeparator className="my-4" />
          <div className="space-y-3">
            <p className="font-medium text-sm">Logged Time Entries:</p>
            <div className="space-y-2">
              {task.worklogs.map((worklog) => (
                <div
                  key={worklog.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <MemberAvatar
                      name={
                        worklog.member?.user?.name ||
                        worklog.member?.user?.email ||
                        "Unknown"
                      }
                      image={worklog.member?.user?.image || undefined}
                      className="size-6"
                      fallbackClassName="text-xs"
                    />
                    <span className="text-sm">
                      {worklog.member?.user?.name ||
                        worklog.member?.user?.email ||
                        "Unknown User"}
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {minutesToTimeEstimateString(worklog.timeSpent)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TaskWorklog;
