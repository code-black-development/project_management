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

import { HTTPException } from "hono/http-exception";

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
      return c.json({ data });
    }
  )
  .post("/", zValidator("json", createTaskSchema), async (c) => {
    const userId = await getSessionUserId(c);
    if (!userId) {
      throw new HTTPException(401, {
        message: "Unauthorized: User not logged in",
      });
    }
    const data = c.req.valid("json");

    const highestPositionTask = await getHighestPositionTask(
      data.workspaceId,
      TaskStatus.TODO
    );

    const newPosition = highestPositionTask
      ? highestPositionTask.position + 1
      : 0;

    const taskData = { ...data, position: newPosition };

    const task = await createTask(taskData);

    return c.json({ data: task });
  });

export default app;
