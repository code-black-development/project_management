import {
  createLinkableTasks,
  createTask,
  createTaskAssets,
  deleteLinkableTasks,
  deleteTask,
  deleteTaskAsset,
  getTaskAssetById,
  getHighestPositionTask,
  getLinkableTasks,
  getTaskById,
  getTaskCategories,
  searchTasks,
  updateTask,
} from "@/lib/dbService/tasks";
import { getProjectById } from "@/lib/dbService/projects";
import { Hono } from "hono";
import { taskSearchSchema, createTaskSchema, patchTaskSchema } from "../schema";
import { zValidator } from "@hono/zod-validator";
import { TaskStatus } from "@prisma/client";
import { string, z } from "zod";
import {
  minutesToTimeEstimateString,
  timeEstimateStringToMinutes,
} from "@/lib/utils";
import {
  getMemberByUserIdAndWorkspaceId,
  getMemberWithUserByUserIdAndWorkspaceId,
} from "@/lib/dbService/workspace-members";
import { HTTPException } from "hono/http-exception";
import { createTaskWorklog } from "@/lib/dbService/task-worklogs";
import { uploadToS3, deleteFromS3, extractS3KeyFromUrl } from "@/lib/s3";
import { TaskAssetFile } from "../_components/task-assets";
import { sendTaskAssignmentNotification } from "@/lib/mailing-functions";
import prisma from "@/prisma/prisma";

const TaskAssetSchema = z.object({
  name: z.string(),
  file: z.string(),
  type: z.string(),
});

const app = new Hono()
  .get("/categories", async (c) => {
    const categories = await getTaskCategories();
    return c.json({ data: categories });
  })
  .delete("/assets/:assetId", async (c) => {
    const { assetId } = c.req.param();

    // Get the asset to find the S3 key before deleting
    const asset = await getTaskAssetById(assetId);
    if (asset?.assetUrl) {
      try {
        const key = extractS3KeyFromUrl(asset.assetUrl);
        if (key) {
          await deleteFromS3(key);
        }
      } catch (error) {
        console.error("Failed to delete asset from S3:", error);
        // Don't fail the deletion if S3 cleanup fails
      }
    }

    const deletedAsset = await deleteTaskAsset(assetId);
    return c.json({ data: deletedAsset });
  })
  .post("/assets", async (c) => {
    try {
      const formData = await c.req.formData();

      const taskId = formData.get("taskId") as string;
      const files = formData.getAll("files") as File[];

      if (!taskId || files.length === 0) {
        return c.json({ message: "No files or taskId provided" }, 400);
      }

      const uploadedFiles: TaskAssetFile[] = [];

      for (const file of files) {
        try {
          // Upload file to S3
          const uploadResult = await uploadToS3(file, "task-assets", file.name);

          uploadedFiles.push({
            name: file.name,
            file: uploadResult.url,
            type: file.type,
          });
        } catch (error) {
          console.error(`Failed to upload file ${file.name}:`, error);
          return c.json({ error: `Failed to upload file ${file.name}` }, 500);
        }
      }

      await createTaskAssets(taskId, uploadedFiles);
      return c.json({ data: taskId });
    } catch (e) {
      console.error(e);
      return c.json({ data: e });
    }
  })
  .delete(
    "/children",
    zValidator(
      "json",
      z.object({
        childTask: z.string(),
        parentId: string(),
      })
    ),
    async (c) => {
      const { childTask, parentId } = c.req.valid("json");
      const tasks = await deleteLinkableTasks(childTask);
      return c.json({ data: parentId });
    }
  )
  .post(
    "/children",
    zValidator(
      "json",
      z.object({
        parentTask: z.string(),
        childTask: z.string(),
      })
    ),
    async (c) => {
      const { parentTask, childTask } = c.req.valid("json");
      const tasks = await createLinkableTasks(parentTask, childTask);
      return c.json({ data: tasks });
    }
  )
  .get("/children/:projectId", async (c) => {
    const { projectId } = c.req.param();
    const tasks = await getLinkableTasks(projectId);
    return c.json({ data: tasks });
  })
  .post(
    "/worklog",
    zValidator(
      "json",
      z.object({
        taskId: z.string(),
        timeSpent: z.number(),
        dateWorked: z.union([z.string().datetime(), z.date()]),
        workDescription: z.string().nullish(),
        userId: z.string(),
        workspaceId: z.string(),
      })
    ),
    async (c) => {
      const {
        taskId,
        timeSpent,
        dateWorked,
        workDescription,
        userId,
        workspaceId,
      } = c.req.valid("json");

      const member = await getMemberByUserIdAndWorkspaceId(userId, workspaceId);

      if (!member) {
        throw new HTTPException(403, {
          message: "You are not a member of this workspace",
        });
      }

      const result = await createTaskWorklog({
        taskId,
        timeSpent,
        //@ts-ignore
        dateWorked:
          dateWorked instanceof String ? new Date(dateWorked) : dateWorked,
        workDescription: workDescription ?? null,
        memberId: member.id,
      });

      return c.json({ data: result });
    }
  )
  .post(
    "/bulk-update",
    zValidator(
      "json",
      z.object({
        tasks: z.array(
          z.object({
            id: z.string(),
            status: z.nativeEnum(TaskStatus),
            position: z.number().int().positive(),
          })
        ),
      })
    ),
    async (c) => {
      const { tasks } = c.req.valid("json");
      //TODO: we should check that these tasks all belong to the same workspace and if the user is a member of the workspace and has permission
      const updatedTasks = await Promise.all(
        tasks.map(async (task: any) => {
          const { id, status, position } = task;
          const result = await updateTask(id, { status, position });
          return {
            ...result,
            timeEstimate: result?.timeEstimate
              ? minutesToTimeEstimateString(result?.timeEstimate)
              : null,
          };
        })
      );
      return c.json({ data: updatedTasks });
    }
  )
  .get("/:taskId", async (c) => {
    const { taskId } = c.req.param();
    //TODO: we should check if the user is a member of the workspace and has permission
    const task = await getTaskById(taskId);

    const result = {
      ...task,
      timeEstimate: task?.timeEstimate
        ? minutesToTimeEstimateString(task?.timeEstimate)
        : null,
    };
    return c.json({ data: result });
  })
  .patch("/:taskId", zValidator("json", patchTaskSchema), async (c) => {
    let {
      name,
      status,
      projectId,
      dueDate,
      assigneeId,
      description,
      timeEstimate,
      categoryId,
    } = c.req.valid("json");

    const { taskId } = c.req.param();

    // Handle dueDate conversion properly
    let dueDateValue: Date | null | undefined = undefined;
    if (dueDate !== undefined) {
      if (dueDate === null) {
        dueDateValue = null;
      } else if (dueDate instanceof Date) {
        dueDateValue = dueDate;
      } else if (typeof dueDate === "string") {
        dueDateValue = new Date(dueDate);
      }
    }

    //TODO: we should check if the user is a member of the workspace and has permission
    const taskData: any = {};

    if (name !== undefined) taskData.name = name;
    if (status !== undefined) taskData.status = status;
    if (projectId !== undefined) taskData.projectId = projectId;
    if (dueDateValue !== undefined) taskData.dueDate = dueDateValue;
    if (assigneeId !== undefined) taskData.assigneeId = assigneeId;
    if (description !== undefined) taskData.description = description;
    if (timeEstimate !== undefined) {
      taskData.timeEstimate = timeEstimate
        ? timeEstimateStringToMinutes(timeEstimate)
        : null;
    }
    if (categoryId !== undefined) taskData.categoryId = categoryId;

    // Get the existing task BEFORE updating to check if assignee changed
    let existingTask = null;
    if (assigneeId !== undefined) {
      existingTask = await prisma.task.findUnique({
        where: { id: taskId },
        select: {
          assigneeId: true,
          projectId: true,
          workspaceId: true,
          name: true,
        },
      });
    }

    const task = await updateTask(taskId, taskData);

    // Send notification email if assignee changed and project has notifications enabled
    if (assigneeId !== undefined && task && existingTask) {
      try {
        // Only send notification if assignee actually changed and there's a new assignee
        if (existingTask.assigneeId !== assigneeId && assigneeId) {
          // Get project settings to check if notifications are enabled
          const project = await getProjectById(existingTask.projectId);

          if (project?.taskAssignmentEmail) {
            // Get assignee details with user information (assigneeId is a member ID)
            const assignee = await prisma.member.findUnique({
              where: { id: assigneeId },
              include: {
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
            });

            if (assignee?.user?.email) {
              // Get assigner details (current user)
              const assigner = await getMemberWithUserByUserIdAndWorkspaceId(
                c.get("userId"),
                existingTask.workspaceId
              );
              const assignerName =
                assigner?.user?.name || assigner?.user?.email || "Someone";

              await sendTaskAssignmentNotification(
                assignee.user.email,
                assignee.user.name || assignee.user.email,
                existingTask.name,
                task.id,
                existingTask.workspaceId,
                assignerName,
                project.name
              );
            }
          }
        }
      } catch (notificationError) {
        console.error(
          "Failed to send task assignment notification:",
          notificationError
        );
        // Don't fail the task update if notification fails
      }
    }

    const result = {
      ...task,
      timeEstimate: task?.timeEstimate
        ? minutesToTimeEstimateString(task?.timeEstimate)
        : null,
    };

    return c.json({ data: result });
  })
  .delete("/:taskId", async (c) => {
    const user = c.get("userId");
    const { taskId } = c.req.param();
    const task = await deleteTask(taskId);
    return c.json({ data: { id: task.id } });
  })
  .get(
    "/",
    zValidator("query", taskSearchSchema, (result, c) => {
      if (!result.success) {
        console.log("validation failed", result.error);
      }
    }),
    async (c) => {
      const data = c.req.valid("query");

      // Check if project has autoHideCompletedTasks enabled
      let excludeCompleted = false;
      if (data.projectId) {
        const project = await getProjectById(data.projectId);
        excludeCompleted = project?.autoHideCompletedTasks || false;
      }

      const tasks = await searchTasks(data, excludeCompleted);
      let result = [];
      for (let task of tasks) {
        result.push({
          ...task,
          timeEstimate: task.timeEstimate
            ? minutesToTimeEstimateString(task.timeEstimate)
            : null,
        });
      }

      return c.json({ data: result });
    }
  )
  .post("/", zValidator("json", createTaskSchema), async (c) => {
    try {
      console.log("=== POST /api/tasks - Request started ===");

      let {
        name,
        status,
        workspaceId,
        projectId,
        dueDate,
        assigneeId,
        description,
        timeEstimate,
        categoryId,
      } = c.req.valid("json");

      console.log("Validated data:", {
        name,
        status,
        workspaceId,
        projectId,
        dueDate,
        assigneeId,
        description,
        timeEstimate,
        categoryId,
      });

      //TODO: we should get the taskstatus passed and check that not just hard code TDOD
      const highestPositionTask = await getHighestPositionTask(
        workspaceId,
        TaskStatus.TODO
      );

      const newPosition = highestPositionTask
        ? highestPositionTask.position + 1
        : 0;
      //TODO: we should check if the user is a member of the workspace and has permission
      const member = await getMemberByUserIdAndWorkspaceId(
        c.get("userId"),
        workspaceId
      );

      if (!member) {
        throw new HTTPException(403, {
          message: "You are not a member of this workspace",
        });
      }

      // Handle dueDate conversion properly
      let dueDateValue: Date | null = null;
      if (dueDate) {
        if (dueDate instanceof Date) {
          dueDateValue = dueDate;
        } else if (typeof dueDate === "string") {
          dueDateValue = new Date(dueDate);
        }
      }

      const taskData = {
        name,
        status,
        workspaceId,
        projectId,
        dueDate: dueDateValue,
        assigneeId: assigneeId ?? null,
        position: newPosition,
        description: description ?? null,
        createdById: member.id,
        timeEstimate: timeEstimate
          ? timeEstimateStringToMinutes(timeEstimate)
          : null,
        categoryId: categoryId ?? null,
      };

      const task = await createTask(taskData);

      // Send notification email if task is assigned and project has notifications enabled
      if (assigneeId && task) {
        try {
          // Get project settings to check if notifications are enabled
          const project = await getProjectById(projectId);

          if (project?.taskAssignmentEmail) {
            // Get assignee details with user information (assigneeId is a member ID)
            const assignee = await prisma.member.findUnique({
              where: { id: assigneeId },
              include: {
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
            });

            if (assignee?.user?.email) {
              // Get assigner details
              const assigner = await getMemberWithUserByUserIdAndWorkspaceId(
                c.get("userId"),
                workspaceId
              );
              const assignerName =
                assigner?.user?.name || assigner?.user?.email || "Someone";

              await sendTaskAssignmentNotification(
                assignee.user.email,
                assignee.user.name || assignee.user.email,
                name,
                task.id,
                workspaceId,
                assignerName,
                project.name
              );
            }
          }
        } catch (notificationError) {
          console.error(
            "Failed to send task assignment notification:",
            notificationError
          );
          // Don't fail the task creation if notification fails
        }
      }

      return c.json({ data: task });
    } catch (error) {
      console.error("=== POST /api/tasks - Error occurred ===");
      console.error("Error details:", error);
      return c.json(
        {
          error: "Internal server error",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  });

export default app;
