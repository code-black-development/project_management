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

const app = new Hono()
  .get("/:taskId", async (c) => {
    const { taskId } = c.req.param();
    //TODO: we should check if the user is a member of the workspace and has permission
    const task = await getTaskById(taskId);
    return c.json({ data: task });
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

      return c.json({ data: task });
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
