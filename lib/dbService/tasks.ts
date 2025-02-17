import { taskSearchSchema } from "@/features/tasks/schema";
import prisma from "@/prisma/prisma";
import { Prisma, Task, TaskStatus } from "@prisma/client";
import { z } from "zod";

export const searchTasks = async (data: z.infer<typeof taskSearchSchema>) => {
  const where: Prisma.TaskWhereInput = {};

  if (data.workspaceId) {
    where.workspaceId = data.workspaceId;
  }

  if (data.projectId) {
    where.projectId = data.projectId;
  }

  if (data.assigneeId) {
    where.assigneeId = data.assigneeId;
  }

  if (data.status) {
    where.status = data.status;
  }

  if (data.search) {
    where.OR = [
      {
        name: {
          contains: data.search,
        },
      },
      {
        description: {
          contains: data.search,
        },
      },
    ];
  }

  if (data.dueDate) {
    where.dueDate = {
      equals: data.dueDate,
    };
  }

  return await prisma.task.findMany({
    where,
  });
};

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
