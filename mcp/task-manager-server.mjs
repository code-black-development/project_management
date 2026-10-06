import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  PrismaClient,
  RecurrenceDuration,
  RecurrenceFrequency,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@prisma/client";
import { z } from "zod";
import { addDays, addMonths, addWeeks, addYears, isBefore, isEqual } from "date-fns";

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
  image: true,
  archivedAt: true,
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
  image: true,
  archivedAt: true,
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
  priority: true,
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
  archivedAt: true,
  isRecurring: true,
  recurrenceFrequency: true,
  recurrenceDuration: true,
  recurrenceEndDate: true,
  originalEventId: true,
  seriesId: true,
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

const defaults = {
  workspaceId: process.env.DEFAULT_WORKSPACE_ID || undefined,
  projectId: process.env.DEFAULT_PROJECT_ID || undefined,
  memberId: process.env.DEFAULT_MEMBER_ID || undefined,
};

const defaultEnvNames = {
  workspaceId: "DEFAULT_WORKSPACE_ID",
  projectId: "DEFAULT_PROJECT_ID",
  memberId: "DEFAULT_MEMBER_ID",
};

// projectId/memberId defaults belong to the default workspace, so they are only
// applied when the call is (implicitly or explicitly) targeting that workspace.
function defaultAppliesTo(key, workspaceId) {
  return key === "workspaceId" || !workspaceId || workspaceId === defaults.workspaceId;
}

function optionalDefault(value, key, workspaceId) {
  if (value !== undefined) return value;
  return defaultAppliesTo(key, workspaceId) ? defaults[key] : undefined;
}

function withDefault(value, key, label, workspaceId) {
  const resolved = optionalDefault(value, key, workspaceId);
  if (!resolved) {
    throw new Error(
      `${label} was not provided and no default is configured for this workspace (set ${defaultEnvNames[key]} in the MCP server environment, or pass it explicitly).`
    );
  }
  return resolved;
}

const normalizeRef = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

// Resolve a task by name or ticket code (dashes/spaces ignored). Exactly one match or an error.
async function resolveTaskByReference(reference, workspaceId, projectId) {
  const candidates = await prisma.task.findMany({
    where: { workspaceId, projectId, taskType: TaskType.TASK },
    select: { id: true, name: true, projectId: true },
  });
  const wanted = normalizeRef(reference);
  const exact = candidates.filter((candidate) => normalizeRef(candidate.name) === wanted);
  const matches =
    exact.length > 0
      ? exact
      : candidates.filter((candidate) => normalizeRef(candidate.name).includes(wanted));

  if (matches.length !== 1) {
    throw new Error(
      matches.length === 0
        ? `No task matching "${reference}" was found. Nothing was changed.`
        : `"${reference}" matches ${matches.length} tasks; nothing was changed. Be more specific: ${matches
            .slice(0, 10)
            .map((match) => `${match.name} (${match.id})`)
            .join(", ")}`
    );
  }
  return matches[0];
}

function parseDurationMinutes(input) {
  const text = input.trim().toLowerCase();
  if (/^\d+(\.\d+)?$/.test(text)) {
    return Math.round(Number(text));
  }
  const match = text.match(
    /^(?:(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours))?\s*(?:(\d+)\s*(?:m|min|mins|minute|minutes))?$/
  );
  if (!match || (!match[1] && !match[2])) {
    throw new Error(`Could not understand duration "${input}". Use e.g. "2h", "1h 30m" or "90".`);
  }
  return Math.round(Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0));
}

const WORKSPACE_DESC = "Workspace id. Defaults to the configured default workspace.";

const server = new McpServer({
  name: "fasta-work",
  version: "0.1.0",
});

server.registerTool(
  "list_workspaces",
  {
    title: "List Workspaces",
    description: "List workspaces. Archived workspaces are hidden unless includeArchived is true.",
    inputSchema: {
      includeArchived: z.boolean().optional().describe("Also return archived workspaces. Defaults to false."),
    },
  },
  async ({ includeArchived }) => {
    const workspaces = await prisma.workspace.findMany({
      where: includeArchived ? undefined : { archivedAt: null },
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
    description:
      "List projects, optionally scoped to one workspace. Archived projects (and projects in archived workspaces) are hidden unless includeArchived is true.",
    inputSchema: {
      workspaceId: z.string().optional().describe("Optional workspace id to filter projects."),
      includeArchived: z.boolean().optional().describe("Also return archived projects. Defaults to false."),
    },
  },
  async ({ workspaceId, includeArchived }) => {
    const projects = await prisma.project.findMany({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
        ...(includeArchived ? {} : { archivedAt: null, workspace: { archivedAt: null } }),
      },
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
      workspaceId: z.string().optional().describe(WORKSPACE_DESC),
    },
  },
  async ({ workspaceId }) => {
    workspaceId = withDefault(workspaceId, "workspaceId", "workspaceId");
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
      workspaceId: z.string().optional().describe(WORKSPACE_DESC),
      projectId: z.string().optional().describe("Optional project id filter."),
      assigneeId: z.string().optional().describe("Optional assignee member id filter."),
      status: z.nativeEnum(TaskStatus).optional().describe("Optional task status filter."),
      priority: z.nativeEnum(TaskPriority).optional().describe("Optional task priority filter (LOW, MEDIUM, HIGH)."),
      search: z.string().optional().describe("Optional name/description search text."),
      includeArchived: z.boolean().optional().describe("Also return archived tasks. Defaults to false."),
      limit: z.number().int().min(1).max(100).optional().describe("Max tasks to return. Defaults to 25."),
    },
  },
  async ({ workspaceId, projectId, assigneeId, status, priority, search, includeArchived, limit }) => {
    workspaceId = withDefault(workspaceId, "workspaceId", "workspaceId");
    const tasks = await prisma.task.findMany({
      where: {
        workspaceId,
        taskType: TaskType.TASK,
        projectId,
        assigneeId,
        status,
        priority,
        ...(includeArchived ? {} : { archivedAt: null }),
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
      workspaceId: z.string().optional().describe(WORKSPACE_DESC),
      projectId: z.string().optional().describe("Project id. Defaults to the configured default project."),
      createdById: z.string().optional().describe("Member id of the creator. Defaults to the configured default member."),
      name: z.string().min(1).describe("Task name."),
      description: z.string().optional().describe("Optional task description."),
      assigneeId: z.string().optional().describe("Optional member id to assign."),
      status: z.nativeEnum(TaskStatus).optional().describe("Defaults to TODO."),
      priority: z.nativeEnum(TaskPriority).optional().describe("Optional priority: LOW, MEDIUM or HIGH."),
      dueDate: z.string().datetime().optional().describe("Optional ISO datetime due date."),
      timeEstimateMinutes: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Optional time estimate in minutes."),
      categoryId: z.string().optional().describe("Optional task category id."),
      parentId: z.string().optional().describe("Optional parent task id."),
      parentTask: z
        .string()
        .optional()
        .describe("Create a subtask: parent task name or ticket code, e.g. SA-102. Alternative to parentId."),
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
    priority,
    dueDate,
    timeEstimateMinutes,
    categoryId,
    parentId,
    parentTask,
  }) => {
    workspaceId = withDefault(workspaceId, "workspaceId", "workspaceId");
    createdById = withDefault(createdById, "memberId", "createdById", workspaceId);
    if (parentTask) {
      if (parentId) {
        throw new Error("Pass either parentId or parentTask, not both.");
      }
      const parent = await resolveTaskByReference(
        parentTask,
        workspaceId,
        optionalDefault(projectId, "projectId", workspaceId)
      );
      parentId = parent.id;
      projectId = projectId ?? parent.projectId;
    }
    projectId = withDefault(projectId, "projectId", "projectId", workspaceId);
    await requireEditableWorkspace(workspaceId);
    await requireEditableProject(projectId, workspaceId);
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
        priority: priority ?? null,
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
      priority: z
        .nativeEnum(TaskPriority)
        .nullable()
        .optional()
        .describe("Updated priority (LOW, MEDIUM, HIGH) or null to clear."),
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

    if (updates.priority !== undefined) data.priority = updates.priority ?? null;
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

// ── Archive-first management tools ───────────────────────────────────────────
// Nothing below hard-deletes workspaces, projects, tasks or events. Archived
// items are hidden from the app and from the list tools but can be restored.

// Acting user: MCP_USER_ID, or the user behind DEFAULT_MEMBER_ID.
async function getActingUserId() {
  if (process.env.MCP_USER_ID) return process.env.MCP_USER_ID;
  if (defaults.memberId) {
    const member = await prisma.member.findUnique({
      where: { id: defaults.memberId },
      select: { userId: true },
    });
    if (member) return member.userId;
  }
  throw new Error("No acting user configured. Set MCP_USER_ID (or DEFAULT_MEMBER_ID) in the MCP server environment.");
}

async function requireEditableWorkspace(workspaceId) {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: workspaceSelect });
  if (!workspace) throw new Error(`Workspace ${workspaceId} was not found.`);
  if (workspace.archivedAt) throw new Error(`Workspace "${workspace.name}" is archived. Unarchive it first.`);
  if (workspace.status === "FROZEN") throw new Error(`Workspace "${workspace.name}" is frozen and cannot be modified.`);
  return workspace;
}

async function requireEditableProject(projectId, workspaceId) {
  const project = await requireProjectInWorkspace(projectId, workspaceId);
  if (project.archivedAt) throw new Error(`Project "${project.name}" is archived. Unarchive it first.`);
  return project;
}

// Task ids plus all descendants and recurring-event occurrences.
async function collectTaskTreeIds(taskIds, archived) {
  const all = new Set(taskIds);
  let frontier = [...all];
  while (frontier.length > 0) {
    const related = await prisma.task.findMany({
      where: {
        OR: [{ parentId: { in: frontier } }, { originalEventId: { in: frontier } }],
        archivedAt: archived ? { not: null } : null,
      },
      select: { id: true },
    });
    frontier = related.map((task) => task.id).filter((id) => !all.has(id));
    frontier.forEach((id) => all.add(id));
  }
  return [...all];
}

server.registerTool(
  "create_workspace",
  {
    title: "Create Workspace",
    description: "Create a workspace owned by the acting user, who becomes its admin member.",
    inputSchema: { name: z.string().min(1).describe("Workspace name.") },
  },
  async ({ name }) => {
    const userId = await getActingUserId();
    const subscription = await prisma.subscription.findUnique({ where: { userId }, include: { plan: true } });
    if (subscription?.plan && subscription.plan.maxWorkspaces !== -1) {
      const count = await prisma.workspace.count({ where: { user: userId, archivedAt: null } });
      if (count >= subscription.plan.maxWorkspaces) {
        throw new Error("Workspace limit reached for the current plan.");
      }
    }
    const workspace = await prisma.workspace.create({
      data: { name, user: userId, members: { create: { userId, role: "admin" } } },
      select: workspaceSelect,
    });
    return textResult({ workspace }, "Created workspace");
  }
);

server.registerTool(
  "update_workspace",
  {
    title: "Update Workspace",
    description: "Rename a workspace.",
    inputSchema: {
      workspaceId: z.string().describe("Workspace id."),
      name: z.string().min(1).describe("New workspace name."),
    },
  },
  async ({ workspaceId, name }) => {
    await requireEditableWorkspace(workspaceId);
    const workspace = await prisma.workspace.update({ where: { id: workspaceId }, data: { name }, select: workspaceSelect });
    return textResult({ workspace }, "Updated workspace");
  }
);

server.registerTool(
  "archive_workspace",
  {
    title: "Archive Workspace",
    description:
      "Archive a workspace so it is hidden from the app and list tools. Nothing is deleted; use unarchive_workspace to restore it.",
    inputSchema: { workspaceId: z.string().describe("Workspace id.") },
  },
  async ({ workspaceId }) => {
    const existing = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: workspaceSelect });
    if (!existing) throw new Error(`Workspace ${workspaceId} was not found.`);
    if (existing.archivedAt) return textResult({ workspace: existing }, "Workspace was already archived");
    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { archivedAt: new Date() },
      select: workspaceSelect,
    });
    return textResult({ workspace }, "Archived workspace");
  }
);

server.registerTool(
  "unarchive_workspace",
  {
    title: "Unarchive Workspace",
    description: "Restore an archived workspace.",
    inputSchema: { workspaceId: z.string().describe("Workspace id.") },
  },
  async ({ workspaceId }) => {
    const existing = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: workspaceSelect });
    if (!existing) throw new Error(`Workspace ${workspaceId} was not found.`);
    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { archivedAt: null },
      select: workspaceSelect,
    });
    return textResult({ workspace }, "Unarchived workspace");
  }
);

server.registerTool(
  "create_project",
  {
    title: "Create Project",
    description: "Create a project in a workspace.",
    inputSchema: {
      workspaceId: z.string().optional().describe(WORKSPACE_DESC),
      name: z.string().min(1).describe("Project name."),
      autoHideCompletedTasks: z.boolean().optional().describe("Hide DONE tasks in the app. Defaults to false."),
      autoHideChildTasks: z.boolean().optional().describe("Hide child tasks in top-level lists."),
      taskAssignmentEmail: z.boolean().optional().describe("Email assignees when assigned. Defaults to true."),
    },
  },
  async ({ workspaceId, name, autoHideCompletedTasks, autoHideChildTasks, taskAssignmentEmail }) => {
    workspaceId = withDefault(workspaceId, "workspaceId", "workspaceId");
    await requireEditableWorkspace(workspaceId);
    const project = await prisma.project.create({
      data: { workspaceId, name, autoHideCompletedTasks, autoHideChildTasks, taskAssignmentEmail },
      select: projectSelect,
    });
    return textResult({ project }, "Created project");
  }
);

server.registerTool(
  "update_project",
  {
    title: "Update Project",
    description: "Update a project's name or settings.",
    inputSchema: {
      projectId: z.string().describe("Project id."),
      name: z.string().min(1).optional().describe("New project name."),
      autoHideCompletedTasks: z.boolean().optional(),
      autoHideChildTasks: z.boolean().nullable().optional(),
      taskAssignmentEmail: z.boolean().optional(),
    },
  },
  async ({ projectId, ...updates }) => {
    const existing = await prisma.project.findUnique({ where: { id: projectId }, select: projectSelect });
    if (!existing) throw new Error(`Project ${projectId} was not found.`);
    await requireEditableWorkspace(existing.workspaceId);
    await requireEditableProject(projectId, existing.workspaceId);
    const project = await prisma.project.update({ where: { id: projectId }, data: updates, select: projectSelect });
    return textResult({ project }, "Updated project");
  }
);

server.registerTool(
  "archive_project",
  {
    title: "Archive Project",
    description:
      "Archive a project so it is hidden from the app and list tools. Its tasks are kept untouched; use unarchive_project to restore it.",
    inputSchema: { projectId: z.string().describe("Project id.") },
  },
  async ({ projectId }) => {
    const existing = await prisma.project.findUnique({ where: { id: projectId }, select: projectSelect });
    if (!existing) throw new Error(`Project ${projectId} was not found.`);
    if (existing.archivedAt) return textResult({ project: existing }, "Project was already archived");
    const project = await prisma.project.update({
      where: { id: projectId },
      data: { archivedAt: new Date() },
      select: projectSelect,
    });
    return textResult({ project }, "Archived project");
  }
);

server.registerTool(
  "unarchive_project",
  {
    title: "Unarchive Project",
    description: "Restore an archived project.",
    inputSchema: { projectId: z.string().describe("Project id.") },
  },
  async ({ projectId }) => {
    const existing = await prisma.project.findUnique({ where: { id: projectId }, select: projectSelect });
    if (!existing) throw new Error(`Project ${projectId} was not found.`);
    const project = await prisma.project.update({
      where: { id: projectId },
      data: { archivedAt: null },
      select: projectSelect,
    });
    return textResult({ project }, "Unarchived project");
  }
);

server.registerTool(
  "archive_task",
  {
    title: "Archive Task",
    description:
      "Archive a task or event, including its child tasks and recurring-event occurrences. Nothing is deleted; use unarchive_task to restore it.",
    inputSchema: { taskId: z.string().describe("Task or event id.") },
  },
  async ({ taskId }) => {
    const existing = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true, name: true, archivedAt: true } });
    if (!existing) throw new Error(`Task ${taskId} was not found.`);
    const ids = await collectTaskTreeIds([taskId], false);
    await prisma.task.updateMany({ where: { id: { in: ids }, archivedAt: null }, data: { archivedAt: new Date() } });
    return textResult({ archived: true, task: { id: existing.id, name: existing.name }, archivedCount: ids.length }, "Archived task");
  }
);

server.registerTool(
  "unarchive_task",
  {
    title: "Unarchive Task",
    description: "Restore an archived task or event, including its child tasks and occurrences.",
    inputSchema: { taskId: z.string().describe("Task or event id.") },
  },
  async ({ taskId }) => {
    const existing = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true, name: true } });
    if (!existing) throw new Error(`Task ${taskId} was not found.`);
    const ids = await collectTaskTreeIds([taskId], true);
    await prisma.task.updateMany({ where: { id: { in: ids }, archivedAt: { not: null } }, data: { archivedAt: null } });
    return textResult({ restored: true, task: existing, restoredCount: ids.length }, "Unarchived task");
  }
);

// ── Categories ───────────────────────────────────────────────────────────────

server.registerTool(
  "list_categories",
  { title: "List Categories", description: "List task categories (shared across all workspaces)." },
  async () => {
    const categories = await prisma.taskCategory.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { tasks: true } } },
    });
    return textResult({ categories }, "Categories");
  }
);

server.registerTool(
  "create_category",
  {
    title: "Create Category",
    description: "Create a task category. Categories are shared across all workspaces.",
    inputSchema: {
      name: z.string().min(1).describe("Category name."),
      icon: z.string().optional().describe("Optional icon name (lucide icon, e.g. bug)."),
      color: z.string().optional().describe("Optional color."),
    },
  },
  async ({ name, icon, color }) => {
    const category = await prisma.taskCategory.create({ data: { name, icon: icon ?? null, color: color ?? null } });
    return textResult({ category }, "Created category");
  }
);

server.registerTool(
  "update_category",
  {
    title: "Update Category",
    description: "Update a task category's name, icon or color.",
    inputSchema: {
      categoryId: z.string().describe("Category id."),
      name: z.string().min(1).optional(),
      icon: z.string().nullable().optional(),
      color: z.string().nullable().optional(),
    },
  },
  async ({ categoryId, ...updates }) => {
    const existing = await prisma.taskCategory.findUnique({ where: { id: categoryId } });
    if (!existing) throw new Error(`Category ${categoryId} was not found.`);
    const category = await prisma.taskCategory.update({ where: { id: categoryId }, data: updates });
    return textResult({ category }, "Updated category");
  }
);

// ── Events ───────────────────────────────────────────────────────────────────

function nextOccurrenceDate(date, frequency) {
  switch (frequency) {
    case RecurrenceFrequency.WEEKLY:
      return addWeeks(date, 1);
    case RecurrenceFrequency.FORTNIGHTLY:
      return addWeeks(date, 2);
    case RecurrenceFrequency.MONTHLY:
      return addMonths(date, 1);
    case RecurrenceFrequency.ANNUALLY:
      return addYears(date, 1);
    default:
      return addDays(date, 1);
  }
}

function recurrenceEnd(event) {
  const start = event.dueDate;
  switch (event.recurrenceDuration) {
    case RecurrenceDuration.ONE_MONTH:
      return addMonths(start, 1);
    case RecurrenceDuration.CUSTOM:
      return event.recurrenceEndDate || addYears(start, 1);
    case RecurrenceDuration.CONTINUOUS:
      return addYears(start, 2);
    default:
      return addYears(start, 1);
  }
}

async function generateOccurrences(eventId) {
  const event = await prisma.task.findUnique({ where: { id: eventId } });
  if (!event || !event.isRecurring || !event.dueDate || !event.recurrenceFrequency) return 0;

  const { id, createdAt, updatedAt, ...base } = event;
  void id; void createdAt; void updatedAt;
  const end = recurrenceEnd(event);
  const occurrences = [];
  let current = nextOccurrenceDate(new Date(event.dueDate), event.recurrenceFrequency);
  while (isBefore(current, end)) {
    occurrences.push({
      ...base,
      dueDate: new Date(current),
      originalEventId: eventId,
      isRecurring: false,
      recurrenceFrequency: null,
      recurrenceDuration: null,
      recurrenceEndDate: null,
    });
    current = nextOccurrenceDate(current, event.recurrenceFrequency);
  }
  if (occurrences.length > 0) await prisma.task.createMany({ data: occurrences });
  return occurrences.length;
}

const recurrenceInput = {
  isRecurring: z.boolean().optional().describe("Make the event repeat."),
  recurrenceFrequency: z.nativeEnum(RecurrenceFrequency).optional().describe("DAILY, WEEKLY, FORTNIGHTLY, MONTHLY or ANNUALLY."),
  recurrenceDuration: z
    .nativeEnum(RecurrenceDuration)
    .optional()
    .describe("ONE_MONTH, ONE_YEAR, CUSTOM (needs recurrenceEndDate) or CONTINUOUS (2 years ahead)."),
  recurrenceEndDate: z.string().datetime().optional().describe("ISO end date when recurrenceDuration is CUSTOM."),
};

server.registerTool(
  "list_events",
  {
    title: "List Events",
    description: "List events (tasks of type EVENT), soonest first.",
    inputSchema: {
      workspaceId: z.string().optional().describe(WORKSPACE_DESC),
      projectId: z.string().optional().describe("Optional project id filter."),
      from: z.string().datetime().optional().describe("Only events on/after this ISO datetime."),
      to: z.string().datetime().optional().describe("Only events on/before this ISO datetime."),
      includeArchived: z.boolean().optional().describe("Also return archived events. Defaults to false."),
      limit: z.number().int().min(1).max(200).optional().describe("Max events. Defaults to 50."),
    },
  },
  async ({ workspaceId, projectId, from, to, includeArchived, limit }) => {
    workspaceId = withDefault(workspaceId, "workspaceId", "workspaceId");
    const events = await prisma.task.findMany({
      where: {
        workspaceId,
        projectId,
        taskType: TaskType.EVENT,
        ...(includeArchived ? {} : { archivedAt: null }),
        ...(from || to ? { dueDate: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
      },
      select: taskSelect,
      orderBy: { dueDate: "asc" },
      take: limit ?? 50,
    });
    return textResult({ events }, "Events");
  }
);

server.registerTool(
  "create_event",
  {
    title: "Create Event",
    description: "Create a calendar event in a workspace project, optionally recurring (occurrences are generated automatically).",
    inputSchema: {
      workspaceId: z.string().optional().describe(WORKSPACE_DESC),
      projectId: z.string().optional().describe("Project id. Defaults to the configured default project."),
      createdById: z.string().optional().describe("Member id of the creator. Defaults to the configured default member."),
      name: z.string().min(1).describe("Event name."),
      dueDate: z.string().datetime().describe("ISO datetime of the event."),
      description: z.string().optional(),
      assigneeId: z.string().optional().describe("Optional member id to assign."),
      categoryId: z.string().optional(),
      ...recurrenceInput,
    },
  },
  async ({ workspaceId, projectId, createdById, name, dueDate, description, assigneeId, categoryId, isRecurring, recurrenceFrequency, recurrenceDuration, recurrenceEndDate }) => {
    workspaceId = withDefault(workspaceId, "workspaceId", "workspaceId");
    createdById = withDefault(createdById, "memberId", "createdById", workspaceId);
    projectId = withDefault(projectId, "projectId", "projectId", workspaceId);
    await requireEditableWorkspace(workspaceId);
    await requireEditableProject(projectId, workspaceId);
    await requireMemberInWorkspace(createdById, workspaceId, "Creator");
    if (assigneeId) await requireMemberInWorkspace(assigneeId, workspaceId, "Assignee");
    if (isRecurring && !recurrenceFrequency) {
      throw new Error("recurrenceFrequency is required when isRecurring is true.");
    }
    if (isRecurring && recurrenceDuration === RecurrenceDuration.CUSTOM && !recurrenceEndDate) {
      throw new Error("recurrenceEndDate is required when recurrenceDuration is CUSTOM.");
    }

    const position = await getNextTaskPosition(workspaceId, TaskStatus.TODO);
    const event = await prisma.task.create({
      data: {
        workspaceId,
        projectId,
        createdById,
        assigneeId: assigneeId ?? null,
        categoryId: categoryId ?? null,
        name,
        description: description ?? null,
        status: TaskStatus.TODO,
        dueDate: new Date(dueDate),
        taskType: TaskType.EVENT,
        position,
        isRecurring: isRecurring ?? false,
        recurrenceFrequency: isRecurring ? recurrenceFrequency : null,
        recurrenceDuration: isRecurring ? (recurrenceDuration ?? RecurrenceDuration.ONE_YEAR) : null,
        recurrenceEndDate: isRecurring && recurrenceEndDate ? new Date(recurrenceEndDate) : null,
      },
      select: taskSelect,
    });
    const occurrences = isRecurring ? await generateOccurrences(event.id) : 0;
    return textResult({ event, occurrencesCreated: occurrences }, "Created event");
  }
);

server.registerTool(
  "update_event",
  {
    title: "Update Event",
    description:
      "Update an event. If the event is recurring and you change its date or recurrence, its generated occurrences are regenerated.",
    inputSchema: {
      eventId: z.string().describe("Event id (the original event, not an occurrence)."),
      name: z.string().min(1).optional(),
      description: z.string().nullable().optional(),
      dueDate: z.string().datetime().optional().describe("New ISO datetime."),
      assigneeId: z.string().nullable().optional(),
      categoryId: z.string().nullable().optional(),
      ...recurrenceInput,
    },
  },
  async ({ eventId, ...updates }) => {
    const existing = await prisma.task.findUnique({ where: { id: eventId } });
    if (!existing || existing.taskType !== TaskType.EVENT) throw new Error(`Event ${eventId} was not found.`);
    await requireEditableWorkspace(existing.workspaceId);
    if (updates.assigneeId) await requireMemberInWorkspace(updates.assigneeId, existing.workspaceId, "Assignee");

    const data = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.assigneeId !== undefined) data.assigneeId = updates.assigneeId;
    if (updates.categoryId !== undefined) data.categoryId = updates.categoryId;
    if (updates.dueDate !== undefined) data.dueDate = new Date(updates.dueDate);
    if (updates.isRecurring !== undefined) data.isRecurring = updates.isRecurring;
    if (updates.recurrenceFrequency !== undefined) data.recurrenceFrequency = updates.recurrenceFrequency;
    if (updates.recurrenceDuration !== undefined) data.recurrenceDuration = updates.recurrenceDuration;
    if (updates.recurrenceEndDate !== undefined) data.recurrenceEndDate = new Date(updates.recurrenceEndDate);
    if (updates.isRecurring === false) {
      data.recurrenceFrequency = null;
      data.recurrenceDuration = null;
      data.recurrenceEndDate = null;
    }

    const event = await prisma.task.update({ where: { id: eventId }, data, select: taskSelect });

    const recurrenceTouched =
      updates.dueDate !== undefined ||
      updates.isRecurring !== undefined ||
      updates.recurrenceFrequency !== undefined ||
      updates.recurrenceDuration !== undefined ||
      updates.recurrenceEndDate !== undefined;
    let occurrencesCreated = 0;
    if (recurrenceTouched || existing.isRecurring) {
      // Same behaviour as the app: occurrences are generated rows, so they are replaced rather than archived.
      if (recurrenceTouched) await prisma.task.deleteMany({ where: { originalEventId: eventId } });
      if (recurrenceTouched) occurrencesCreated = await generateOccurrences(eventId);
    }
    return textResult({ event, occurrencesCreated }, "Updated event");
  }
);

// ── Task series ──────────────────────────────────────────────────────────────

async function copyTaskTree(originalParentId, newParentId, memberId) {
  const children = await prisma.task.findMany({ where: { parentId: originalParentId, archivedAt: null } });
  for (const child of children) {
    const { id, createdAt, updatedAt, parentId, seriesId, ...childData } = child;
    void createdAt; void updatedAt; void parentId; void seriesId;
    const copy = await prisma.task.create({
      data: { ...childData, parentId: newParentId, createdById: memberId, seriesId: null },
    });
    await copyTaskTree(id, copy.id, memberId);
  }
}

server.registerTool(
  "create_task_series",
  {
    title: "Create Task Series",
    description:
      "Repeat an existing task (with its child tasks) on a schedule until an end date. The task needs a due date; copies are created at each interval.",
    inputSchema: {
      taskId: z.string().describe("Id of the task to repeat. Needs a due date."),
      frequency: z.enum(["WEEKLY", "FORTNIGHTLY", "MONTHLY"]).describe("How often to repeat."),
      endDate: z.string().datetime().describe("ISO datetime; copies are created up to and including this date."),
      createdById: z.string().optional().describe("Member id recorded as creator of the copies. Defaults to the configured default member."),
    },
  },
  async ({ taskId, frequency, endDate, createdById }) => {
    const original = await prisma.task.findFirst({ where: { id: taskId, archivedAt: null } });
    if (!original) throw new Error(`Task ${taskId} was not found.`);
    if (!original.dueDate) throw new Error("Task must have a due date to create a series.");
    if (original.seriesId) throw new Error("Task is already part of a series.");
    await requireEditableWorkspace(original.workspaceId);
    createdById = withDefault(createdById, "memberId", "createdById", original.workspaceId);
    await requireMemberInWorkspace(createdById, original.workspaceId, "Creator");

    const end = new Date(endDate);
    const dates = [];
    for (let i = 1; ; i++) {
      const date =
        frequency === "WEEKLY" ? addDays(original.dueDate, 7 * i)
        : frequency === "FORTNIGHTLY" ? addDays(original.dueDate, 14 * i)
        : addMonths(original.dueDate, i);
      if (!isBefore(date, end) && !isEqual(date, end)) break;
      dates.push(date);
      if (dates.length > 500) throw new Error("Series would create more than 500 tasks; choose an earlier endDate.");
    }
    if (dates.length === 0) throw new Error("endDate is too early to create any repeats.");

    const seriesId = randomUUID();
    await prisma.task.update({ where: { id: taskId }, data: { seriesId } });
    let position = await getNextTaskPosition(original.workspaceId, original.status);
    const { id, createdAt, updatedAt, parentId, seriesId: _s, ...taskData } = original;
    void id; void createdAt; void updatedAt; void parentId; void _s;
    for (const date of dates) {
      const copy = await prisma.task.create({
        data: { ...taskData, dueDate: date, seriesId, createdById, position: position++ },
      });
      await copyTaskTree(taskId, copy.id, createdById);
    }
    return textResult({ seriesId, copiesCreated: dates.length }, "Created task series");
  }
);

const worklogSelect = {
  id: true,
  taskId: true,
  memberId: true,
  timeSpent: true,
  workDescription: true,
  dateWorked: true,
  createdAt: true,
  updatedAt: true,
  task: {
    select: {
      id: true,
      name: true,
      projectId: true,
      workspaceId: true,
    },
  },
  member: {
    select: {
      id: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  },
};

async function requireWorklogInWorkspace(worklogId, workspaceId) {
  const worklog = await prisma.worklog.findUnique({
    where: { id: worklogId },
    select: worklogSelect,
  });

  if (!worklog) {
    throw new Error(`Worklog ${worklogId} was not found.`);
  }

  if (worklog.task.workspaceId !== workspaceId) {
    throw new Error(`Worklog ${worklogId} does not belong to workspace ${workspaceId}.`);
  }

  return worklog;
}

server.registerTool(
  "create_worklog",
  {
    title: "Create Worklog",
    description: "Log time spent on a task. Time is recorded in minutes.",
    inputSchema: {
      workspaceId: z.string().optional().describe(WORKSPACE_DESC),
      taskId: z.string().describe("Task id."),
      memberId: z.string().optional().describe("Member id of the person who did the work. Defaults to the configured default member."),
      timeSpentMinutes: z.number().int().min(1).describe("Time spent in minutes."),
      dateWorked: z
        .string()
        .datetime()
        .optional()
        .describe("ISO datetime the work was done. Defaults to now."),
      workDescription: z.string().optional().describe("Optional description of the work done."),
    },
  },
  async ({ workspaceId, taskId, memberId, timeSpentMinutes, dateWorked, workDescription }) => {
    workspaceId = withDefault(workspaceId, "workspaceId", "workspaceId");
    memberId = withDefault(memberId, "memberId", "memberId", workspaceId);
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, workspaceId: true },
    });

    if (!task || task.workspaceId !== workspaceId) {
      throw new Error(`Task ${taskId} was not found in workspace ${workspaceId}.`);
    }

    await requireMemberInWorkspace(memberId, workspaceId, "Member");

    const worklog = await prisma.worklog.create({
      data: {
        taskId,
        memberId,
        timeSpent: timeSpentMinutes,
        dateWorked: dateWorked ? new Date(dateWorked) : new Date(),
        workDescription: workDescription ?? null,
      },
      select: worklogSelect,
    });

    return textResult({ worklog }, "Created worklog");
  }
);

server.registerTool(
  "list_worklogs",
  {
    title: "List Worklogs",
    description:
      "List worklogs in a workspace, filtered by project, task, member and/or a dateWorked range (e.g. all of October). Returns total minutes and per-task / per-member breakdowns for the full filtered set.",
    inputSchema: {
      workspaceId: z.string().optional().describe(WORKSPACE_DESC),
      projectId: z.string().optional().describe("Optional project id filter."),
      taskId: z.string().optional().describe("Optional task id filter."),
      memberId: z.string().optional().describe("Optional member id filter."),
      from: z
        .string()
        .datetime()
        .optional()
        .describe("Optional ISO datetime; include work done on or after this."),
      to: z
        .string()
        .datetime()
        .optional()
        .describe("Optional ISO datetime; include work done before this (exclusive)."),
      limit: z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .describe("Max worklogs to return. Defaults to 100. Totals cover all matches."),
    },
  },
  async ({ workspaceId, projectId, taskId, memberId, from, to, limit }) => {
    workspaceId = withDefault(workspaceId, "workspaceId", "workspaceId");
    const where = {
      taskId,
      memberId,
      task: { workspaceId, projectId },
      ...(from || to
        ? {
            dateWorked: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lt: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const [worklogs, totalCount, byTask, byMember] = await Promise.all([
      prisma.worklog.findMany({
        where,
        select: worklogSelect,
        orderBy: [{ dateWorked: "desc" }, { createdAt: "desc" }],
        take: limit ?? 100,
      }),
      prisma.worklog.aggregate({
        where,
        _sum: { timeSpent: true },
        _count: true,
      }),
      prisma.worklog.groupBy({
        by: ["taskId"],
        where,
        _sum: { timeSpent: true },
        _count: true,
      }),
      prisma.worklog.groupBy({
        by: ["memberId"],
        where,
        _sum: { timeSpent: true },
        _count: true,
      }),
    ]);

    const taskNames = new Map(
      (
        await prisma.task.findMany({
          where: { id: { in: byTask.map((row) => row.taskId) } },
          select: { id: true, name: true },
        })
      ).map((task) => [task.id, task.name])
    );
    const memberNames = new Map(
      (
        await prisma.member.findMany({
          where: { id: { in: byMember.map((row) => row.memberId) } },
          select: { id: true, user: { select: { name: true, email: true } } },
        })
      ).map((member) => [member.id, member.user.name ?? member.user.email])
    );

    return textResult(
      {
        totalMinutes: totalCount._sum.timeSpent ?? 0,
        totalCount: totalCount._count,
        returnedCount: worklogs.length,
        byTask: byTask.map((row) => ({
          taskId: row.taskId,
          taskName: taskNames.get(row.taskId),
          minutes: row._sum.timeSpent ?? 0,
          count: row._count,
        })),
        byMember: byMember.map((row) => ({
          memberId: row.memberId,
          memberName: memberNames.get(row.memberId),
          minutes: row._sum.timeSpent ?? 0,
          count: row._count,
        })),
        worklogs,
      },
      "Worklogs"
    );
  }
);

server.registerTool(
  "update_worklog",
  {
    title: "Update Worklog",
    description: "Update the time, date or description of an existing worklog.",
    inputSchema: {
      workspaceId: z.string().optional().describe(WORKSPACE_DESC),
      worklogId: z.string().describe("Worklog id."),
      timeSpentMinutes: z.number().int().min(1).optional().describe("Updated time in minutes."),
      dateWorked: z.string().datetime().optional().describe("Updated ISO datetime worked."),
      workDescription: z
        .string()
        .nullable()
        .optional()
        .describe("Updated description, or null to clear."),
    },
  },
  async ({ workspaceId, worklogId, timeSpentMinutes, dateWorked, workDescription }) => {
    workspaceId = withDefault(workspaceId, "workspaceId", "workspaceId");
    await requireWorklogInWorkspace(worklogId, workspaceId);

    const worklog = await prisma.worklog.update({
      where: { id: worklogId },
      data: {
        ...(timeSpentMinutes !== undefined ? { timeSpent: timeSpentMinutes } : {}),
        ...(dateWorked !== undefined ? { dateWorked: new Date(dateWorked) } : {}),
        ...(workDescription !== undefined ? { workDescription } : {}),
      },
      select: worklogSelect,
    });

    return textResult({ worklog }, "Updated worklog");
  }
);

server.registerTool(
  "delete_worklog",
  {
    title: "Delete Worklog",
    description: "Delete a worklog by id.",
    inputSchema: {
      workspaceId: z.string().optional().describe(WORKSPACE_DESC),
      worklogId: z.string().describe("Worklog id."),
    },
  },
  async ({ workspaceId, worklogId }) => {
    workspaceId = withDefault(workspaceId, "workspaceId", "workspaceId");
    const existing = await requireWorklogInWorkspace(worklogId, workspaceId);

    await prisma.worklog.delete({ where: { id: worklogId } });

    return textResult({ deleted: true, worklog: existing }, "Deleted worklog");
  }
);

server.registerTool(
  "log_work",
  {
    title: "Log Work",
    description:
      "Quick way to log time against a task by name or ticket code (e.g. SA-102). Uses the default workspace, project and member. Fails with a list of candidates if the task reference is ambiguous.",
    inputSchema: {
      task: z.string().min(1).describe("Task name or ticket code, e.g. SA-102 (dashes/spaces are ignored)."),
      duration: z.string().describe('Time spent, e.g. "2h", "1h 30m", "45m" or "90" (minutes).'),
      workDescription: z.string().optional().describe("Optional description of the work done."),
      dateWorked: z.string().datetime().optional().describe("ISO datetime the work was done. Defaults to now."),
      workspaceId: z.string().optional().describe(WORKSPACE_DESC),
      projectId: z.string().optional().describe("Project id. Defaults to the configured default project."),
      memberId: z.string().optional().describe("Member id. Defaults to the configured default member."),
    },
  },
  async ({ task, duration, workDescription, dateWorked, workspaceId, projectId, memberId }) => {
    workspaceId = withDefault(workspaceId, "workspaceId", "workspaceId");
    projectId = optionalDefault(projectId, "projectId", workspaceId);
    memberId = withDefault(memberId, "memberId", "memberId", workspaceId);

    const minutes = parseDurationMinutes(duration);
    if (minutes < 1) {
      throw new Error("Duration must be at least 1 minute.");
    }

    await requireMemberInWorkspace(memberId, workspaceId, "Member");
    const match = await resolveTaskByReference(task, workspaceId, projectId);

    const worklog = await prisma.worklog.create({
      data: {
        taskId: match.id,
        memberId,
        timeSpent: minutes,
        dateWorked: dateWorked ? new Date(dateWorked) : new Date(),
        workDescription: workDescription ?? null,
      },
      select: worklogSelect,
    });

    return textResult({ worklog }, `Logged ${minutes} minutes on ${match.name}`);
  }
);

export async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("fasta-work running on stdio");
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectRun) {
  startServer().catch(async (error) => {
    console.error("Failed to start fasta-work:", error);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  });
}
