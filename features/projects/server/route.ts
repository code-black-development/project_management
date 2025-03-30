import {
  createProject,
  deleteProject,
  getProjectById,
  getProjectsByWorkspaceId,
  updateProject,
} from "@/lib/dbService/projects";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { createProjectSchema, updateProjectSchema } from "../schema";
import { uploadImageToLocalStorage } from "@/lib/image-upload";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import {
  getProjectOverdueTasks,
  getProjectTasksInDateRange,
} from "@/lib/dbService/tasks";
import { TaskStatus } from "@prisma/client";

const app = new Hono()
  .delete("/:projectId", async (c) => {
    const { projectId } = c.req.param();
    //TODO: check if the user is an admin of the workspace
    const project = await deleteProject(projectId);
    return c.json({ data: project });
  })
  .patch(
    "/:projectId",
    zValidator("form", updateProjectSchema),

    async (c) => {
      const { projectId } = c.req.param();
      const { name, image } = c.req.valid("form");
      //TODO: check if the user is a member of the workspace
      let fileUrl: string | null = null;
      if (image instanceof File) {
        fileUrl = await uploadImageToLocalStorage(image);
      }

      const project = await updateProject(projectId, {
        name,
        ...((image instanceof File || !image) && { image: fileUrl }),
      });

      return c.json({ data: project });
    }
  )
  .post("/", zValidator("form", createProjectSchema), async (c) => {
    const { name, image, workspaceId } = c.req.valid("form");
    console.log("create project");
    //await onlyWorkspaceMember(c, userId, workspaceId, true); //this will return from the route if the logged in user is not an admin of the workspace

    let fileUrl: string | null = null;
    if (image instanceof File) {
      fileUrl = await uploadImageToLocalStorage(image);
    }
    const project = await createProject({
      name,
      workspaceId,
      image: fileUrl,
    });

    return c.json({ data: project });
  })
  .get(
    "/",

    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const { workspaceId } = c.req.valid("query");
      const projects = await getProjectsByWorkspaceId(workspaceId);
      return c.json({ data: projects });
    }
  )
  .get("/:projectId", async (c) => {
    const { projectId } = c.req.param();
    const project = await getProjectById(projectId);

    return c.json({ data: project });
  })
  .get("/:projectId/analytics", async (c) => {
    const { projectId } = c.req.param();

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thismonthTasks = await getProjectTasksInDateRange(
      projectId,
      thisMonthStart,
      thisMonthEnd
    );

    const lastMonthTasks = await getProjectTasksInDateRange(
      projectId,
      lastMonthStart,
      lastMonthEnd
    );
    const overdueProjectTasks = await getProjectOverdueTasks(
      projectId,
      new Date()
    );

    const taskCount = thismonthTasks.length;
    const taskDifference = taskCount - lastMonthTasks.length;

    const thisMonthIncompleteTasks = thismonthTasks.filter(
      (task) => task.status !== TaskStatus.DONE
    );
    const lastMonthIncompleteTasks = lastMonthTasks.filter(
      (task) => task.status !== TaskStatus.DONE
    );
    const incompleteTaskCount = thisMonthIncompleteTasks.length;
    const incompleteTaskDifference =
      incompleteTaskCount - lastMonthIncompleteTasks.length;

    const thisMonthCompletedTasks = thismonthTasks.filter(
      (task) => task.status === TaskStatus.DONE
    );
    const lastMonthCompletedTasks = lastMonthTasks.filter(
      (task) => task.status === TaskStatus.DONE
    );
    const completedTaskCount = thisMonthCompletedTasks.length;
    const completedTaskDifference =
      completedTaskCount - lastMonthCompletedTasks.length;

    const overdueProjectTasksTotalCount = overdueProjectTasks.length;
    const thisMonthOverdueProjectTasks = overdueProjectTasks.filter(
      (task) =>
        task.createdAt >= thisMonthStart && task.createdAt <= thisMonthEnd
    );
    const lastMonthOverdueProjectTasks = overdueProjectTasks.filter(
      (task) =>
        task.createdAt >= lastMonthStart && task.createdAt <= lastMonthEnd
    );
    const lastMonthOverdueProjectTasksCount =
      lastMonthOverdueProjectTasks.length;
    const thisMonthOverdueProjectTasksCount =
      thisMonthOverdueProjectTasks.length;

    const overdueProjectTasksDifference =
      thisMonthOverdueProjectTasksCount - lastMonthOverdueProjectTasksCount;

    return c.json({
      taskCount,
      taskDifference,
      completedTaskCount,
      completedTaskDifference,
      incompleteTaskCount,
      incompleteTaskDifference,
      overdueProjectTasksTotalCount,
      overdueProjectTasksCount: thisMonthOverdueProjectTasksCount,
      overdueProjectTasksDifference,
    });
  });

export default app;
