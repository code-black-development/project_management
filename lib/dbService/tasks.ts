import { taskSearchSchema } from "@/features/tasks/schema";
import prisma from "@/prisma/prisma";
import type { TaskAssetFile } from "@/types/types";
import { Prisma, Task, TaskStatus } from "@prisma/client";
import { addDays, addMonths, isBefore, isEqual } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

// Safe user select to exclude sensitive fields
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  emailVerified: true,
} as const;

export const searchTasks = async (
  data: z.infer<typeof taskSearchSchema>,
  excludeCompleted?: boolean,
  excludeChildTasks?: boolean
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

  // Add logic to exclude child tasks (tasks that have a parent)
  if (excludeChildTasks) {
    where.parentId = null;
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
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      assigneeId: true,
      projectId: true,
      workspaceId: true,
      dueDate: true,
      status: true,
      position: true,
      timeEstimate: true,
      createdById: true,
      parentId: true,
      categoryId: true,
      taskType: true,
      isRecurring: true,
      recurrenceFrequency: true,
      recurrenceDuration: true,
      recurrenceEndDate: true,
      originalEventId: true,
      seriesId: true,
      project: {
        select: {
          id: true,
          name: true,
          image: true,
          workspaceId: true,
          createdAt: true,
          updatedAt: true,
          autoHideCompletedTasks: true,
          autoHideChildTasks: true,
          taskAssignmentEmail: true,
        },
      },
      assignee: {
        select: {
          id: true,
          workspaceId: true,
          userId: true,
          role: true,
          suspended: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              emailVerified: true,
            },
          },
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { position: "asc" }, { updatedAt: "desc" }],
    take: data.limit,
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
        assignee: { include: { user: { select: safeUserSelect } } },
        createdBy: { include: { user: { select: safeUserSelect } } },
        parent: {
          include: {
            project: true,
            assignee: { include: { user: { select: safeUserSelect } } },
            createdBy: { include: { user: { select: safeUserSelect } } },
          },
        },
        worklogs: {
          include: {
            member: {
              include: {
                user: { select: safeUserSelect },
              },
            },
          },
          orderBy: {
            dateWorked: "desc",
          },
        },
        children: {
          include: {
            assignee: { include: { user: { select: safeUserSelect } } },
            createdBy: { include: { user: { select: safeUserSelect } } },
            project: true,
            worklogs: {
              include: {
                member: {
                  include: {
                    user: { select: safeUserSelect },
                  },
                },
              },
            },
            assets: true,
            category: true,
            children: {
              include: {
                assignee: { include: { user: { select: safeUserSelect } } },
                createdBy: { include: { user: { select: safeUserSelect } } },
                project: true,
                worklogs: true,
                assets: true,
                category: true,
              },
            },
          },
        },
        assets: true,
        category: true,
      },
    });

    return result;
  } catch (e) {
    console.error(JSON.stringify(e));
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
      assignee: { include: { user: { select: safeUserSelect } } },
      createdBy: { include: { user: { select: safeUserSelect } } },
      worklogs: {
        include: {
          member: {
            include: {
              user: { select: safeUserSelect },
            },
          },
        },
        orderBy: {
          dateWorked: "desc",
        },
      },
      assets: true,
      category: true,
    },
  });
};

export const createTask = async (
  data: Omit<Task, "createdAt" | "updatedAt" | "id" | "parentId">
) => {
  try {
    return await prisma.task.create({ data });
  } catch (e) {
    console.error(JSON.stringify(e));
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
    console.error(JSON.stringify(e));
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

export const deleteTasksByIds = async (taskIds: string[]) => {
  return await prisma.task.deleteMany({
    where: {
      id: {
        in: taskIds,
      },
    },
  });
};

export const getTaskAndDescendantIds = async (taskIds: string[]) => {
  const allTaskIds = new Set(taskIds);
  let currentParentIds = [...allTaskIds];

  while (currentParentIds.length > 0) {
    const children = await prisma.task.findMany({
      where: {
        parentId: {
          in: currentParentIds,
        },
      },
      select: {
        id: true,
      },
    });

    const newChildIds = children
      .map((child) => child.id)
      .filter((id) => !allTaskIds.has(id));

    newChildIds.forEach((id) => allTaskIds.add(id));
    currentParentIds = newChildIds;
  }

  return [...allTaskIds];
};

export const getTaskAssetUrlsForTaskIds = async (taskIds: string[]) => {
  if (taskIds.length === 0) return [];

  const idsForDeletion = await getTaskAndDescendantIds(taskIds);
  const assets = await prisma.taskAsset.findMany({
    where: {
      taskId: {
        in: idsForDeletion,
      },
    },
    select: {
      assetUrl: true,
    },
  });

  return assets.map((asset) => asset.assetUrl);
};

export const getTaskAssetUrlsByProjectId = async (projectId: string) => {
  const assets = await prisma.taskAsset.findMany({
    where: {
      task: {
        projectId,
      },
    },
    select: {
      assetUrl: true,
    },
  });

  return assets.map((asset) => asset.assetUrl);
};

export const getTaskAssetUrlsByWorkspaceId = async (workspaceId: string) => {
  const assets = await prisma.taskAsset.findMany({
    where: {
      task: {
        workspaceId,
      },
    },
    select: {
      assetUrl: true,
    },
  });

  return assets.map((asset) => asset.assetUrl);
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
    console.error(JSON.stringify(e));
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
    await prisma.taskAsset.createMany({
      data,
    });
  } catch (e) {
    console.error(JSON.stringify(e));
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

// ── Task Series ──────────────────────────────────────────────────────────────

type SeriesFrequency = "WEEKLY" | "FORTNIGHTLY" | "MONTHLY";

function generateSeriesDates(startDate: Date, frequency: SeriesFrequency, endDate: Date): Date[] {
  const dates: Date[] = [];
  let i = 1;

  while (true) {
    let current: Date;
    if (frequency === "WEEKLY") current = addDays(startDate, 7 * i);
    else if (frequency === "FORTNIGHTLY") current = addDays(startDate, 14 * i);
    else current = addMonths(startDate, i);

    if (!isBefore(current, endDate) && !isEqual(current, endDate)) break;
    dates.push(current);
    i++;
  }

  return dates;
}

async function copyDescendants(
  originalParentId: string,
  newParentId: string,
  memberId: string,
) {
  const children = await prisma.task.findMany({
    where: { parentId: originalParentId },
  });

  for (const child of children) {
    const { id, createdAt, updatedAt, parentId: _p, seriesId: _s, ...childData } = child;
    void id; void createdAt; void updatedAt; void _p; void _s;
    const childCopy = await prisma.task.create({
      data: { ...childData, parentId: newParentId, createdById: memberId, seriesId: null },
    });
    await copyDescendants(child.id, childCopy.id, memberId);
  }
}

export const generateTaskSeries = async (
  taskId: string,
  frequency: SeriesFrequency,
  endDate: Date,
  memberId: string,
) => {
  const original = await prisma.task.findUnique({ where: { id: taskId } });
  if (!original || !original.dueDate) {
    throw new Error("Task must have a due date to create a series");
  }

  const seriesId = uuidv4();

  await prisma.task.update({ where: { id: taskId }, data: { seriesId } });

  const dates = generateSeriesDates(original.dueDate, frequency, endDate);

  const highestPos = await getHighestPositionTask(original.workspaceId, original.status);
  let nextPosition = highestPos ? highestPos.position + 1 : 0;

  const { id, createdAt, updatedAt, parentId, seriesId: _s, ...taskData } = original;
  void id; void createdAt; void updatedAt; void parentId; void _s;

  for (const date of dates) {
    const copy = await prisma.task.create({
      data: {
        ...taskData,
        dueDate: date,
        seriesId,
        createdById: memberId,
        position: nextPosition++,
      },
    });
    await copyDescendants(taskId, copy.id, memberId);
  }

  return { seriesId, count: dates.length };
};

export const deleteTaskSeries = async (
  seriesId: string,
  scope: "all" | "upcoming",
  fromTaskId?: string,
) => {
  const where: Prisma.TaskWhereInput = { seriesId, parentId: null };

  if (scope === "upcoming") {
    if (fromTaskId) {
      const fromTask = await prisma.task.findUnique({
        where: { id: fromTaskId },
        select: { dueDate: true },
      });
      if (fromTask?.dueDate) {
        where.dueDate = { gte: fromTask.dueDate };
      }
    } else {
      where.dueDate = { gte: new Date() };
    }
  }

  const tasks = await prisma.task.findMany({ where, select: { id: true } });
  const ids = tasks.map((t) => t.id);

  if (ids.length === 0) return 0;

  await prisma.task.deleteMany({ where: { id: { in: ids } } });
  return ids.length;
};

export const getSeriesTasks = async (seriesId: string) => {
  return await prisma.task.findMany({
    where: { seriesId, parentId: null },
    select: { id: true, name: true, dueDate: true, status: true },
    orderBy: { dueDate: "asc" },
  });
};
