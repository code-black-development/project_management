import { TaskAssetFile } from "@/features/tasks/_components/task-assets";
import { taskSearchSchema } from "@/features/tasks/schema";
import prisma from "@/prisma/prisma";
import { Prisma, Task, TaskStatus } from "@prisma/client";
import { z } from "zod";

export const searchTasks = async (
  data: z.infer<typeof taskSearchSchema>,
  excludeCompleted?: boolean
) => {
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

  // Add logic to exclude completed tasks
  if (excludeCompleted) {
    if (where.status) {
      // If status filter already exists, we need to combine it with the NOT DONE condition
      const existingStatus = where.status;
      where.status = {
        in:
          typeof existingStatus === "object" && "in" in existingStatus
            ? (existingStatus.in as TaskStatus[]).filter(
                (s) => s !== TaskStatus.DONE
              )
            : existingStatus !== TaskStatus.DONE
              ? [existingStatus as TaskStatus]
              : [],
      };
    } else {
      where.status = { not: TaskStatus.DONE };
    }
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
      createdBy: { include: { user: true } },
      worklogs: true,
      assets: true,
      category: true,
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
        createdBy: { include: { user: true } },
        worklogs: true,
        children: { include: { children: true } },
        assets: true,
        category: true,
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
    include: {
      project: true,
      assignee: { include: { user: true } },
      createdBy: { include: { user: true } },
      category: true,
    },
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

export const createTaskAssets = async (
  taskId: string,
  files: TaskAssetFile[]
) => {
  try {
    const data = files.map((file) => ({
      taskId,
      fileName: file.name,
      assetUrl: file.file,
      assetType: file.type,
    }));
    console.log("data", data);
    await prisma.taskAsset.createMany({
      data,
    });
  } catch (e) {
    console.log(JSON.stringify(e));
    throw new Error("Failed to create task assets");
  }
};

export const deleteTaskAsset = async (assetId: string) => {
  return await prisma.taskAsset.delete({
    where: {
      id: assetId,
    },
  });
};

export const getTaskAssetById = async (assetId: string) => {
  return await prisma.taskAsset.findUnique({
    where: {
      id: assetId,
    },
  });
};

export const getTaskCategories = async () => {
  return await prisma.taskCategory.findMany({
    orderBy: {
      name: "asc",
    },
  });
};
