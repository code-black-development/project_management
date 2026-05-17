import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ProjectAnalyticsResponseType } from "@/features/projects/api/use-get-project-analytics";
import AnalyticsCard from "./analytics-card";

interface AnalyticsProps {
  data: ProjectAnalyticsResponseType;
}

const Analytics = ({ data }: AnalyticsProps) => {
  return (
    <ScrollArea className="border border-border rounded-xl w-full whitespace-nowrap shrink-0 bg-card">
      <div className="w-full flex flex-row divide-x divide-border">
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
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default Analytics;
