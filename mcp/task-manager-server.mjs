import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { PrismaClient, TaskStatus, TaskType } from "@prisma/client";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function resolveSdkEsmRoot() {
  const explicitRoot = process.env.MCP_SDK_ROOT;
  const candidates = [
    explicitRoot,
    path.join(repoRoot, "node_modules", "@modelcontextprotocol", "sdk", "dist", "esm"),
  ].filter(Boolean);

  const projectsDir = path.join(os.homedir(), "Documents", "projects");
  if (fs.existsSync(projectsDir)) {
    for (const entry of fs.readdirSync(projectsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      candidates.push(
        path.join(
          projectsDir,
          entry.name,
          "node_modules",
          "@modelcontextprotocol",
          "sdk",
          "dist",
          "esm"
        )
      );
      candidates.push(
        path.join(
          projectsDir,
          entry.name,
          entry.name,
          "node_modules",
          "@modelcontextprotocol",
          "sdk",
          "dist",
          "esm"
        )
      );
    }
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (fs.existsSync(path.join(candidate, "server", "mcp.js"))) {
      return candidate;
    }
  }

  throw new Error(
    [
      "Unable to locate @modelcontextprotocol/sdk.",
      "Install it in this repo or set MCP_SDK_ROOT to a dist/esm directory.",
    ].join(" ")
  );
}

const sdkRoot = resolveSdkEsmRoot();
const [{ McpServer }, { StdioServerTransport }] = await Promise.all([
  import(pathToFileURL(path.join(sdkRoot, "server", "mcp.js")).href),
  import(pathToFileURL(path.join(sdkRoot, "server", "stdio.js")).href),
]);

const prisma = new PrismaClient();

const workspaceSelect = {
  id: true,
  name: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

const projectSelect = {
  id: true,
  name: true,
  workspaceId: true,
  autoHideCompletedTasks: true,
  autoHideChildTasks: true,
  taskAssignmentEmail: true,
  createdAt: true,
  updatedAt: true,
};

const memberSelect = {
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
      lastLoginAt: true,
    },
  },
};

const taskSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  taskType: true,
  workspaceId: true,
  projectId: true,
  assigneeId: true,
  createdById: true,
  position: true,
  dueDate: true,
  timeEstimate: true,
  categoryId: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
  project: {
    select: {
      id: true,
      name: true,
      workspaceId: true,
    },
  },
  assignee: {
    select: memberSelect,
  },
  createdBy: {
    select: memberSelect,
  },
  category: {
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
    },
  },
  _count: {
    select: {
      children: true,
      assets: true,
      worklogs: true,
    },
  },
};

function normalizeDate(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function serialize(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serialize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, serialize(nestedValue)])
    );
  }

  return value;
}

function textResult(payload, label) {
  return {
    content: [
      {
        type: "text",
        text: `${label}\n${JSON.stringify(serialize(payload), null, 2)}`,
      },
    ],
    structuredContent: serialize(payload),
  };
}

async function requireProjectInWorkspace(projectId, workspaceId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: projectSelect,
  });

  if (!project) {
    throw new Error(`Project ${projectId} was not found.`);
  }

  if (project.workspaceId !== workspaceId) {
    throw new Error(`Project ${projectId} does not belong to workspace ${workspaceId}.`);
  }

  return project;
}

async function requireMemberInWorkspace(memberId, workspaceId, fieldName) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: memberSelect,
  });

  if (!member) {
    throw new Error(`${fieldName} ${memberId} was not found.`);
  }

  if (member.workspaceId !== workspaceId) {
    throw new Error(`${fieldName} ${memberId} does not belong to workspace ${workspaceId}.`);
  }

  return member;
}

async function getNextTaskPosition(workspaceId, status) {
  const result = await prisma.task.aggregate({
    where: {
      workspaceId,
      status,
      taskType: TaskType.TASK,
    },
    _max: {
      position: true,
    },
  });

  return (result._max.position ?? 0) + 1;
}

const server = new McpServer({
  name: "project-management-task-server",
  version: "0.1.0",
});

server.registerTool(
  "list_workspaces",
  {
    title: "List Workspaces",
    description: "List workspaces available in the local project database.",
  },
  async () => {
    const workspaces = await prisma.workspace.findMany({
      select: workspaceSelect,
      orderBy: { updatedAt: "desc" },
    });

    return textResult({ workspaces }, "Workspaces");
  }
);

server.registerTool(
  "list_projects",
  {
    title: "List Projects",
    description: "List projects, optionally scoped to one workspace.",
    inputSchema: {
      workspaceId: z.string().optional().describe("Optional workspace id to filter projects."),
    },
  },
  async ({ workspaceId }) => {
    const projects = await prisma.project.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      select: projectSelect,
      orderBy: [{ workspaceId: "asc" }, { updatedAt: "desc" }],
    });

    return textResult({ projects }, "Projects");
  }
);

server.registerTool(
  "list_members",
  {
    title: "List Members",
    description: "List workspace members so you can choose assignee and creator ids.",
    inputSchema: {
      workspaceId: z.string().describe("Workspace id to list members for."),
    },
  },
  async ({ workspaceId }) => {
    const members = await prisma.member.findMany({
      where: { workspaceId },
      select: memberSelect,
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });

    return textResult({ members }, "Workspace members");
  }
);

server.registerTool(
  "list_tasks",
  {
    title: "List Tasks",
    description: "List tasks with basic filters so you can inspect ids before editing or deleting.",
    inputSchema: {
      workspaceId: z.string().describe("Workspace id to search within."),
      projectId: z.string().optional().describe("Optional project id filter."),
      assigneeId: z.string().optional().describe("Optional assignee member id filter."),
      status: z.nativeEnum(TaskStatus).optional().describe("Optional task status filter."),
      search: z.string().optional().describe("Optional name/description search text."),
      limit: z.number().int().min(1).max(100).optional().describe("Max tasks to return. Defaults to 25."),
    },
  },
  async ({ workspaceId, projectId, assigneeId, status, search, limit }) => {
    const tasks = await prisma.task.findMany({
      where: {
        workspaceId,
        taskType: TaskType.TASK,
        projectId,
        assigneeId,
        status,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: taskSelect,
      orderBy: [{ updatedAt: "desc" }],
      take: limit ?? 25,
    });

    return textResult({ tasks }, "Tasks");
  }
);

server.registerTool(
  "get_task",
  {
    title: "Get Task",
    description: "Fetch a single task by id.",
    inputSchema: {
      taskId: z.string().describe("Task id."),
    },
  },
  async ({ taskId }) => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: taskSelect,
    });

    if (!task) {
      throw new Error(`Task ${taskId} was not found.`);
    }

    return textResult({ task }, "Task");
  }
);

server.registerTool(
  "create_task",
  {
    title: "Create Task",
    description: "Create a standard task in a workspace project.",
    inputSchema: {
      workspaceId: z.string().describe("Workspace id."),
      projectId: z.string().describe("Project id."),
      createdById: z.string().describe("Member id of the creator."),
      name: z.string().min(1).describe("Task name."),
      description: z.string().optional().describe("Optional task description."),
      assigneeId: z.string().optional().describe("Optional member id to assign."),
      status: z.nativeEnum(TaskStatus).optional().describe("Defaults to TODO."),
      dueDate: z.string().datetime().optional().describe("Optional ISO datetime due date."),
      timeEstimateMinutes: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Optional time estimate in minutes."),
      categoryId: z.string().optional().describe("Optional task category id."),
      parentId: z.string().optional().describe("Optional parent task id."),
    },
  },
  async ({
    workspaceId,
    projectId,
    createdById,
    name,
    description,
    assigneeId,
    status,
    dueDate,
    timeEstimateMinutes,
    categoryId,
    parentId,
  }) => {
    await requireProjectInWorkspace(projectId, workspaceId);
    await requireMemberInWorkspace(createdById, workspaceId, "Creator");

    if (assigneeId) {
      await requireMemberInWorkspace(assigneeId, workspaceId, "Assignee");
    }

    if (parentId) {
      const parent = await prisma.task.findUnique({
        where: { id: parentId },
        select: { id: true, workspaceId: true },
      });
      if (!parent || parent.workspaceId !== workspaceId) {
        throw new Error(`Parent task ${parentId} does not belong to workspace ${workspaceId}.`);
      }
    }

    if (categoryId) {
      const category = await prisma.taskCategory.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });
      if (!category) {
        throw new Error(`Category ${categoryId} was not found.`);
      }
    }

    const nextStatus = status ?? TaskStatus.TODO;
    const position = await getNextTaskPosition(workspaceId, nextStatus);

    const task = await prisma.task.create({
      data: {
        workspaceId,
        projectId,
        createdById,
        assigneeId: assigneeId ?? null,
        name,
        description: description ?? null,
        status: nextStatus,
        dueDate: dueDate ? new Date(dueDate) : null,
        timeEstimate: timeEstimateMinutes ?? null,
        categoryId: categoryId ?? null,
        parentId: parentId ?? null,
        taskType: TaskType.TASK,
        position,
      },
      select: taskSelect,
    });

    return textResult({ task }, "Created task");
  }
);

server.registerTool(
  "update_task",
  {
    title: "Update Task",
    description: "Update editable fields on a standard task.",
    inputSchema: {
      taskId: z.string().describe("Task id."),
      name: z.string().min(1).optional().describe("Updated task name."),
      description: z.string().nullable().optional().describe("Updated description or null to clear."),
      assigneeId: z.string().nullable().optional().describe("Updated assignee member id or null to unassign."),
      status: z.nativeEnum(TaskStatus).optional().describe("Updated task status."),
      dueDate: z
        .string()
        .datetime()
        .nullable()
        .optional()
        .describe("Updated ISO due date or null to clear."),
      timeEstimateMinutes: z
        .number()
        .int()
        .min(0)
        .nullable()
        .optional()
        .describe("Updated time estimate in minutes or null to clear."),
      categoryId: z.string().nullable().optional().describe("Updated category id or null to clear."),
      parentId: z.string().nullable().optional().describe("Updated parent task id or null to clear."),
      projectId: z.string().optional().describe("Updated project id."),
    },
  },
  async (args) => {
    const { taskId, ...updates } = args;

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        workspaceId: true,
        projectId: true,
        status: true,
        taskType: true,
      },
    });

    if (!existingTask) {
      throw new Error(`Task ${taskId} was not found.`);
    }

    if (existingTask.taskType !== TaskType.TASK) {
      throw new Error("This MCP server only updates standard tasks, not events.");
    }

    const workspaceId = existingTask.workspaceId;
    const data = {};

    if (updates.projectId) {
      await requireProjectInWorkspace(updates.projectId, workspaceId);
      data.projectId = updates.projectId;
    }

    if (updates.assigneeId !== undefined) {
      if (updates.assigneeId) {
        await requireMemberInWorkspace(updates.assigneeId, workspaceId, "Assignee");
      }
      data.assigneeId = updates.assigneeId ?? null;
    }

    if (updates.categoryId !== undefined) {
      if (updates.categoryId) {
        const category = await prisma.taskCategory.findUnique({
          where: { id: updates.categoryId },
          select: { id: true },
        });
        if (!category) {
          throw new Error(`Category ${updates.categoryId} was not found.`);
        }
      }
      data.categoryId = updates.categoryId ?? null;
    }

    if (updates.parentId !== undefined) {
      if (updates.parentId) {
        if (updates.parentId === taskId) {
          throw new Error("A task cannot be its own parent.");
        }
        const parent = await prisma.task.findUnique({
          where: { id: updates.parentId },
          select: { id: true, workspaceId: true },
        });
        if (!parent || parent.workspaceId !== workspaceId) {
          throw new Error(`Parent task ${updates.parentId} does not belong to workspace ${workspaceId}.`);
        }
      }
      data.parentId = updates.parentId ?? null;
    }

    if (updates.status && updates.status !== existingTask.status) {
      data.status = updates.status;
      data.position = await getNextTaskPosition(workspaceId, updates.status);
    }

    if (updates.name !== undefined) data.name = updates.name;
    if (updates.description !== undefined) data.description = updates.description ?? null;
    if (updates.dueDate !== undefined) {
      data.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    }
    if (updates.timeEstimateMinutes !== undefined) {
      data.timeEstimate = updates.timeEstimateMinutes ?? null;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
      select: taskSelect,
    });

    return textResult({ task }, "Updated task");
  }
);

server.registerTool(
  "delete_task",
  {
    title: "Delete Task",
    description: "Delete a task by id. Child tasks, assets, and worklogs will cascade.",
    inputSchema: {
      taskId: z.string().describe("Task id."),
    },
  },
  async ({ taskId }) => {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        name: true,
        workspaceId: true,
        projectId: true,
        status: true,
        taskType: true,
      },
    });

    if (!existingTask) {
      throw new Error(`Task ${taskId} was not found.`);
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return textResult(
      {
        deleted: true,
        task: existingTask,
      },
      "Deleted task"
    );
  }
);

export async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("project-management-task-server running on stdio");
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectRun) {
  startServer().catch(async (error) => {
    console.error("Failed to start project-management-task-server:", error);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  });
}
