import { ProjectAnalyticsResponseType } from "@/features/projects/api/use-get-project-analytics";
import AnalyticsCard from "./analytics-card";

interface AnalyticsProps {
  data: ProjectAnalyticsResponseType;
}

const Analytics = ({ data }: AnalyticsProps) => {
  return (
    <div className="border border-border rounded-xl w-full shrink-0 bg-card grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
      <AnalyticsCard
        title="Total Tasks"
        value={data.taskCount}
        variant={data.taskDifference > 0 ? "up" : "down"}
        increaseValue={data.taskDifference}
      />
      <AnalyticsCard
        title="Completed"
        value={data.completedTaskCount}
        variant={data.completedTaskDifference > 0 ? "up" : "down"}
        increaseValue={data.completedTaskDifference}
      />
      <AnalyticsCard
        title="Incomplete"
        value={data.incompleteTaskCount}
        variant={data.incompleteTaskDifference > 0 ? "up" : "down"}
        increaseValue={data.incompleteTaskDifference}
      />
      <AnalyticsCard
        title="Overdue"
        value={data.overdueProjectTasksTotalCount}
        variant={data.overdueProjectTasksDifference > 0 ? "up" : "down"}
        increaseValue={data.overdueProjectTasksDifference}
      />
    </div>
  );
};

export default Analytics;
