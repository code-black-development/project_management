"use client";

import { minutesToTimeEstimateString } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UsersIcon,
} from "lucide-react";

interface TimeReportCardProps {
  title: string;
  totalEstimatedMinutes: number;
  totalLoggedMinutes: number;
  tasksWithEstimates: number;
  tasksWithoutEstimates: number;
  totalTasks: number;
  icon?: React.ReactNode;
  className?: string;
}

export const TimeReportCard = ({
  title,
  totalEstimatedMinutes,
  totalLoggedMinutes,
  tasksWithEstimates,
  tasksWithoutEstimates,
  totalTasks,
  icon,
  className,
}: TimeReportCardProps) => {
  const completionPercentage =
    totalEstimatedMinutes > 0
      ? Math.min((totalLoggedMinutes / totalEstimatedMinutes) * 100, 100)
      : 0;

  const estimatePercentage =
    totalTasks > 0 ? (tasksWithEstimates / totalTasks) * 100 : 0;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Time Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated Time</span>
              <span className="font-medium">
                {totalEstimatedMinutes > 0
                  ? minutesToTimeEstimateString(totalEstimatedMinutes)
                  : "No estimates"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Logged Time</span>
              <span className="font-medium">
                {totalLoggedMinutes > 0
                  ? minutesToTimeEstimateString(totalLoggedMinutes)
                  : "No time logged"}
              </span>
            </div>
            {totalEstimatedMinutes > 0 && (
              <>
                <Progress value={completionPercentage} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">
                  {completionPercentage.toFixed(1)}% of estimated time logged
                </div>
              </>
            )}
          </div>

          {/* Task Estimates Summary */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="size-4 text-green-500" />
                <span>With Estimates</span>
              </div>
              <span className="font-medium">{tasksWithEstimates}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <XCircleIcon className="size-4 text-red-500" />
                <span>Without Estimates</span>
              </div>
              <span className="font-medium">{tasksWithoutEstimates}</span>
            </div>
            <Progress value={estimatePercentage} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {estimatePercentage.toFixed(1)}% of tasks have time estimates
            </div>
          </div>

          {/* Total Tasks */}
          <div className="flex justify-between items-center text-sm pt-2 border-t">
            <span className="text-muted-foreground">Total Tasks</span>
            <span className="font-bold">{totalTasks}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
