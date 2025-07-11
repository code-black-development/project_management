"use client";

import { ProjectTimeReport } from "@/lib/dbService/reports";
import { TimeReportCard } from "./time-report-card";
import ProjectAvatar from "@/features/projects/_components/project-avatar";
import { FolderIcon } from "lucide-react";

interface ProjectTimeGridProps {
  projects: ProjectTimeReport[];
}

export const ProjectTimeGrid = ({ projects }: ProjectTimeGridProps) => {
  if (projects.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
        <FolderIcon className="size-12 mx-auto mb-4 opacity-50" />
        <p>No projects found in this workspace.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <TimeReportCard
          key={project.id}
          title={project.name}
          totalEstimatedMinutes={project.totalEstimatedMinutes}
          totalLoggedMinutes={project.totalLoggedMinutes}
          tasksWithEstimates={project.tasksWithEstimates}
          tasksWithoutEstimates={project.tasksWithoutEstimates}
          totalTasks={project.totalTasks}
          icon={
            <ProjectAvatar
              name={project.name}
              image={project.image || undefined}
              className="size-6"
            />
          }
        />
      ))}
    </div>
  );
};
