import {
  createTask,
  deleteTask,
  getHighestPositionTask,
  getTaskById,
  searchTasks,
  updateTask,
} from "@/lib/dbService/tasks";
import { Hono } from "hono";
import { taskSearchSchema } from "../schema";
import { zValidator } from "@hono/zod-validator";
import { TaskStatus } from "@prisma/client";
import { z } from "zod";
import { minutesToTimeEstimateString } from "@/lib/utils";

const app = new Hono()
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
  .patch(
    "/:taskId",
    //TODO: we should find out why we can't use the createTaskSchema here (400 Bad Request when we do)
    zValidator(
      "json",
      z.object({
        name: z.string(),
        projectId: z.string(),
        status: z.nativeEnum(TaskStatus),
        workspaceId: z.string(),
        assigneeId: z.string().nullish(),
        description: z.string().nullish(),
        dueDate: z.string().nullish(),
      })
    ),
    async (c) => {
      const { name, status, projectId, dueDate, assigneeId, description } =
        c.req.valid("json");

      console.log("update task is running", c.req.valid("json"));
      const { taskId } = c.req.param();

      //TODO: we should check if the user is a member of the workspace and has permission
      const taskData = {
        name,
        status,
        projectId,
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(assigneeId && { assigneeId }),
        ...(description && { description }),
      };

      const task = await updateTask(taskId, taskData);
      const result = {
        ...task,
        timeEstimate: task?.timeEstimate
          ? minutesToTimeEstimateString(task?.timeEstimate)
          : null,
      };

      return c.json({ data: result });
    }
  )
  .delete("/:taskId", async (c) => {
    const user = c.get("userId");
    const { taskId } = c.req.param();
    const task = await deleteTask(taskId);
    return c.json({ data: { id: task.id } });
  })
  .get("/", zValidator("query", taskSearchSchema), async (c) => {
    const data = c.req.valid("query");
    const tasks = await searchTasks(data);
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
  })
  .post(
    "/",
    //TODO: we should find out why we can't use the createTaskSchema here (400 Bad Request when we do)
    zValidator(
      "json",
      z.object({
        name: z.string(),
        projectId: z.string(),
        status: z.nativeEnum(TaskStatus),
        workspaceId: z.string(),
        assigneeId: z.string().nullish(),
        description: z.string().nullish(),
        dueDate: z.string().nullish(),
      })
    ),
    async (c) => {
      const {
        name,
        status,
        workspaceId,
        projectId,
        dueDate,
        assigneeId,
        description,
      } = c.req.valid("json");

      //TODO: we should get the taskstatus passed and check that not just hard code TDOD
      const highestPositionTask = await getHighestPositionTask(
        workspaceId,
        TaskStatus.TODO
      );

      const newPosition = highestPositionTask
        ? highestPositionTask.position + 1
        : 0;
      //TODO: we should check if the user is a member of the workspace and has permission
      const taskData = {
        name,
        status,
        workspaceId,
        projectId,
        dueDate: typeof dueDate === "string" ? new Date(dueDate) : dueDate,
        assigneeId: assigneeId ?? null,
        position: newPosition,
        description: description ?? null,
      };

      const task = await createTask(taskData);

      return c.json(task);
    }
  );

export default app;
