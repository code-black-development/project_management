import {
  createTask,
  getHighestPositionTask,
  getTasksByProjectId,
  getTasksByWorkspaceId,
} from "@/lib/dbService/tasks";
import { Hono } from "hono";
import { TaskSchema } from "../schemas";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "@/features/auth/server/authMiddleware";
import { TaskStatus } from "@prisma/client";
import { z } from "zod";

const app = new Hono()
  .get(
    "/",
    authMiddleware,
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
  .post("/", authMiddleware, zValidator("json", TaskSchema), async (c) => {
    const userId = c.get("userId");
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
