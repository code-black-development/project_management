import prisma from "@/prisma/prisma";

export interface WorkspaceTimeReport {
  totalEstimatedMinutes: number;
  totalLoggedMinutes: number;
  tasksWithEstimates: number;
  tasksWithoutEstimates: number;
  totalTasks: number;
}

export interface ProjectTimeReport {
  id: string;
  name: string;
  image: string | null;
  totalEstimatedMinutes: number;
  totalLoggedMinutes: number;
  tasksWithEstimates: number;
  tasksWithoutEstimates: number;
  totalTasks: number;
}

export interface UserTimeReport {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  totalLoggedMinutes: number;
  tasksWorkedOn: number;
}

export const getWorkspaceTimeReport = async (
  workspaceId: string
): Promise<WorkspaceTimeReport> => {
  // Get all tasks with their time estimates and worklogs
  const tasks = await prisma.task.findMany({
    where: { workspaceId },
    select: {
      id: true,
      timeEstimate: true,
      worklogs: {
        select: {
          timeSpent: true,
        },
      },
    },
  });

  let totalEstimatedMinutes = 0;
  let totalLoggedMinutes = 0;
  let tasksWithEstimates = 0;
  let tasksWithoutEstimates = 0;

  tasks.forEach((task) => {
    // Count time estimates
    if (task.timeEstimate && task.timeEstimate > 0) {
      totalEstimatedMinutes += task.timeEstimate;
      tasksWithEstimates++;
    } else {
      tasksWithoutEstimates++;
    }

    // Sum logged time
    const taskLoggedTime = task.worklogs.reduce(
      (sum, worklog) => sum + worklog.timeSpent,
      0
    );
    totalLoggedMinutes += taskLoggedTime;
  });

  return {
    totalEstimatedMinutes,
    totalLoggedMinutes,
    tasksWithEstimates,
    tasksWithoutEstimates,
    totalTasks: tasks.length,
  };
};

export const getProjectTimeReports = async (
  workspaceId: string
): Promise<ProjectTimeReport[]> => {
  const projects = await prisma.project.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      image: true,
      Task: {
        select: {
          id: true,
          timeEstimate: true,
          worklogs: {
            select: {
              timeSpent: true,
            },
          },
        },
      },
    },
  });

  return projects.map((project) => {
    let totalEstimatedMinutes = 0;
    let totalLoggedMinutes = 0;
    let tasksWithEstimates = 0;
    let tasksWithoutEstimates = 0;

    project.Task.forEach((task) => {
      // Count time estimates
      if (task.timeEstimate && task.timeEstimate > 0) {
        totalEstimatedMinutes += task.timeEstimate;
        tasksWithEstimates++;
      } else {
        tasksWithoutEstimates++;
      }

      // Sum logged time
      const taskLoggedTime = task.worklogs.reduce(
        (sum, worklog) => sum + worklog.timeSpent,
        0
      );
      totalLoggedMinutes += taskLoggedTime;
    });

    return {
      id: project.id,
      name: project.name,
      image: project.image,
      totalEstimatedMinutes,
      totalLoggedMinutes,
      tasksWithEstimates,
      tasksWithoutEstimates,
      totalTasks: project.Task.length,
    };
  });
};

export const getUserTimeReports = async (
  workspaceId: string
): Promise<UserTimeReport[]> => {
  const members = await prisma.member.findMany({
    where: { workspaceId },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      Worklog: {
        select: {
          timeSpent: true,
          taskId: true,
        },
      },
    },
  });

  return members.map((member) => {
    const totalLoggedMinutes = member.Worklog.reduce(
      (sum, worklog) => sum + worklog.timeSpent,
      0
    );
    const uniqueTaskIds = new Set(
      member.Worklog.map((worklog) => worklog.taskId)
    );

    return {
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,
      totalLoggedMinutes,
      tasksWorkedOn: uniqueTaskIds.size,
    };
  });
};
