import {
  createProject,
  deleteProject,
  getProjectsByWorkspaceId,
  updateProject,
} from "@/lib/dbService/projects";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { createProjectSchema, updateProjectSchema } from "../schema";
import { uploadImageToLocalStorage } from "@/lib/image-upload";
import { onlyWorkspaceMember } from "@/lib/dbService/db-utils";
import { getSessionUserId } from "@/lib/auth-functions";
import { HTTPException } from "hono/http-exception";

const app = new Hono()
  .delete("/:projectId", async (c) => {
    const userId = await getSessionUserId(c);
    if (!userId) {
      throw new HTTPException(401, {
        message: "Unauthorized: User not logged in",
      });
    }
    const { projectId } = c.req.param();
    //TODO: check if the user is an admin of the workspace
    const project = await deleteProject(projectId);
    return c.json({ data: project });
  })
  .patch(
    "/:projectId",
    zValidator("form", updateProjectSchema),

    async (c) => {
      const userId = await getSessionUserId(c);
      if (!userId) {
        throw new HTTPException(401, {
          message: "Unauthorized: User not logged in",
        });
      }
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
    const userId = await getSessionUserId(c);
    if (!userId) {
      throw new HTTPException(401, {
        message: "Unauthorized: User not logged in",
      });
    }
    const { name, image, workspaceId } = c.req.valid("form");

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
      const userId = await getSessionUserId(c);
      const { workspaceId } = c.req.valid("query");

      if (!userId) {
        throw new HTTPException(401, {
          message: "Unauthorized: User not logged in",
        });
      }

      const projects = await getProjectsByWorkspaceId(workspaceId);

      return c.json({ data: projects });
    }
  );

export default app;
