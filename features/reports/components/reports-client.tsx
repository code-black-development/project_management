"use client";

import { useGetReports } from "../api/use-get-reports";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import PageLoader from "@/components/page-loader";
import PageError from "@/components/page-error";
import { TimeReportCard } from "../components/time-report-card";
import { ProjectTimeGrid } from "../components/project-time-grid";
import { UserTimeTable } from "../components/user-time-table";
import { BarChart3Icon, BuildingIcon, UsersIcon } from "lucide-react";
import DottedSeparator from "@/components/dotted-separator";

const ReportsClient = () => {
  const workspaceId = useWorkspaceId();
  const {
    data: reportsData,
    isLoading,
    error,
  } = useGetReports({ workspaceId });

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !reportsData) {
    return <PageError message="Failed to load reports" />;
  }

  const { workspace, projects, users } = reportsData;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-x-2">
        <BarChart3Icon className="size-6" />
        <h1 className="text-2xl font-bold">Reports</h1>
      </div>

      {/* Workspace Overview */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BuildingIcon className="size-5" />
          Workspace Overview
        </h2>
        <TimeReportCard
          title="Total Workspace Time"
          totalEstimatedMinutes={workspace.totalEstimatedMinutes}
          totalLoggedMinutes={workspace.totalLoggedMinutes}
          tasksWithEstimates={workspace.tasksWithEstimates}
          tasksWithoutEstimates={workspace.tasksWithoutEstimates}
          totalTasks={workspace.totalTasks}
          icon={<BarChart3Icon className="size-4 text-muted-foreground" />}
          className="max-w-md"
        />
      </div>

      <DottedSeparator />

      {/* Projects Breakdown */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Time by Project</h2>
        <ProjectTimeGrid projects={projects} />
      </div>

      <DottedSeparator />

      {/* Users Breakdown */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UsersIcon className="size-5" />
          Time by User
        </h2>
        <UserTimeTable users={users} />
      </div>
    </div>
  );
};

export default ReportsClient;
