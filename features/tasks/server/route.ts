import {
  createTask,
  getHighestPositionTask,
  getTasksByProjectId,
  getTasksByWorkspaceId,
  searchTasks,
} from "@/lib/dbService/tasks";
import { Hono } from "hono";
import { createTaskSchema, taskSearchSchema } from "../schema";
import { zValidator } from "@hono/zod-validator";
import { TaskStatus } from "@prisma/client";
import { z } from "zod";

const app = new Hono()
  .get("/", zValidator("query", taskSearchSchema), async (c) => {
    const data = c.req.valid("query");
    const tasks = await searchTasks(data);

    return c.json({ data: tasks });
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
        dueDate: typeof dueDate === "string" ? new Date(dueDate) : null,
        assigneeId: assigneeId ?? null,
        position: newPosition,
        description: description ?? null,
      };

      const task = await createTask(taskData);

      return c.json(task);
    }
  );

export default app;
