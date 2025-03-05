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
    include: {
      project: true,
      assignee: { include: { user: true } },
      worklogs: true,
    },
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
  try {
    const result = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: true,
        assignee: { include: { user: true } },
        worklogs: true,
        children: { include: { children: true } },
      },
    });
    return result;
  } catch (e) {
    console.log(JSON.stringify(e));
    throw new Error("Failed to get task");
  }
};

export const getTasksByWorkspaceId = async (workspaceId: string) => {
  return await prisma.task.findMany({
    where: {
      workspaceId,
    },
    include: { project: true, assignee: { include: { user: true } } },
  });
};

export const createTask = async (
  data: Omit<Task, "createdAt" | "updatedAt" | "id" | "parentId">
) => {
  try {
    console.log("create task db", data);
    return await prisma.task.create({ data });
  } catch (e) {
    console.log(JSON.stringify(e));
    throw new Error("Failed to create task");
  }
};
/* type UpdateTaskSchema = {
  name?: string;
  status?: TaskStatus;
  projectId?: string;
  dueDate?: Date;
  assigneeId?: string;
  description?: string;
  position?: number;
}; */
export const updateTask = async (taskId: string, data: Partial<Task>) => {
  try {
    return await prisma.task.update({
      where: {
        id: taskId,
      },
      data,
    });
  } catch (e) {
    console.log(JSON.stringify(e));
    throw new Error("Failed to update task");
  }
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

export const getProjectTasksInDateRange = async (
  projectId: string,
  startDate: Date,
  endDate: Date
) => {
  return await prisma.task.findMany({
    where: {
      projectId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
};

export const getProjectOverdueTasks = async (projectId: string, date: Date) => {
  return await prisma.task.findMany({
    where: {
      projectId,
      dueDate: {
        lt: date,
      },
    },
  });
};

export const getWorkspaceTasksInDateRange = async (
  workspaceId: string,
  startDate: Date,
  endDate: Date
) => {
  return await prisma.task.findMany({
    where: {
      workspaceId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
};

export const getWorkspaceOverdueTasks = async (
  workspaceId: string,
  date: Date
) => {
  return await prisma.task.findMany({
    where: {
      workspaceId,
      dueDate: {
        lt: date,
      },
    },
  });
};

export const getLinkableTasks = async (projectId: string) => {
  try {
    const res = await prisma.task.findMany({
      where: {
        projectId,
        parentId: null,
      },
    });
    return res;
  } catch (e) {
    console.log(JSON.stringify(e));
    throw new Error("Failed to get linkable tasks");
  }
};

export const createLinkableTasks = async (
  parentTask: string,
  childTask: string
) => {
  return await prisma.task.update({
    where: {
      id: childTask,
    },
    data: {
      parentId: parentTask,
    },
  });
};

export const deleteLinkableTasks = async (taskId: string) => {
  return await prisma.task.update({
    where: {
      id: taskId,
      //parentId,
    },
    data: {
      parentId: null,
    },
  });
};
