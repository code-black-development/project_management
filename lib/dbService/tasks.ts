import prisma from "@/prisma/prisma";
import { Task, TaskStatus } from "@prisma/client";

export const getTasksByProjectId = async (projectId: string) => {
  return await prisma.task.findMany({
    where: {
      projectId,
    },
  });
};

export const getTaskById = async (taskId: string) => {
  return await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });
};

export const getTasksByWorkspaceId = async (workspaceId: string) => {
  return await prisma.task.findMany({
    where: {
      workspaceId,
    },
  });
};

export const createTask = async (
  data: Omit<Task, "createdAt" | "updatedAt" | "id">
) => {
  try {
    return await prisma.task.create({ data });
  } catch (e) {
    console.log(JSON.stringify(e));
  }
};

export const updateTask = async (taskId: string, data: Partial<Task>) => {
  return await prisma.task.update({
    where: {
      id: taskId,
    },
    data,
  });
};

export const deleteTask = async (taskId: string) => {
  return await prisma.task.delete({
    where: {
      id: taskId,
    },
  });
};

export const getHighestPositionTask = async (
  workspaceId: string,
  status: TaskStatus
) => {
  return await prisma.task.findFirst({
    where: {
      workspaceId,
      status,
    },
    orderBy: {
      position: "asc",
    },
  });
};
