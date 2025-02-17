import {
  createTask,
  getHighestPositionTask,
  getTasksByProjectId,
  getTasksByWorkspaceId,
} from "@/lib/dbService/tasks";
import { Hono } from "hono";
import { createTaskSchema } from "../schema";
import { zValidator } from "@hono/zod-validator";
import { TaskStatus } from "@prisma/client";
import { z } from "zod";

const app = new Hono()
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        workspaceId: z.string(),
        projectId: z.string().nullish(),
        assigneeId: z.string().nullish(),
        status: z.nativeEnum(TaskStatus).nullish(),
        search: z.string().nullish(),
        dueDate: z.date().nullish(),
      })
    ),
    async (c) => {
      const { workspaceId, projectId, assigneeId, status, search, dueDate } =
        c.req.valid("query");
      const tasks = await getTasksByWorkspaceId(workspaceId);
      // return c.json({ data });
    }
  )
  .post(
    "/",
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
