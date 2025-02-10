import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createWorkspaceSchema, updateWorkspaceSchema } from "../schemas";
import { HTTPException } from "hono/http-exception";
import { join } from "path";
import { writeFile } from "fs/promises";
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaceByUserId,
  updateWorkspace,
} from "@/lib/dbService/workspaces";
import { getSessionUserId } from "@/lib/authFunctions";
import { string } from "zod";

const app = new Hono()
  .get("/", async (c) => {
    const userId = await getSessionUserId(c);
    if (!userId) {
      throw new HTTPException(401, { message: "Custom error message" });
    }
    const workspaces = await getWorkspaceByUserId(userId);
    return c.json({ data: workspaces });
  })
  .post("/", zValidator("form", createWorkspaceSchema), async (c) => {
    const userId = await getSessionUserId(c);
    if (!userId) {
      throw new HTTPException(401, { message: "Custom error message" });
    }
    const { name, image } = c.req.valid("form");

    //TODO - image upload is optional so maybe we should not return error - should check if we actually get an error if no image is uploaded
    if (!image) {
      return c.json({ error: "No file uploaded" }, 400);
    }
    let fileUrl: string | null = null;
    if (image instanceof File) {
      const uploadDir = "uploaded_files";
      const buffer = Buffer.from(await image.arrayBuffer());
      const uploadDirPath = join(process.cwd(), "public", uploadDir);
      await writeFile(`${uploadDirPath}/${image.name}`, buffer);
      fileUrl = `${uploadDir}/${image.name}`;
    }

    const workspace = await createWorkspace(name, fileUrl, userId!);

    return c.json({ data: workspace });
  })
  .patch(
    "/:workspaceId",
    zValidator("form", updateWorkspaceSchema),
    async (c) => {
      const userId = await getSessionUserId(c);
      if (!userId) {
        throw new HTTPException(401, { message: "Custom error message" });
      }
      const { workspaceId } = c.req.param();
      const { name, image } = c.req.valid("form");

      console.log("name", name);
      console.log("image", image);

      console.log("user id", userId);

      let fileUrl: string | null;

      if (image instanceof File) {
        const uploadDir = "uploaded_files";
        const buffer = Buffer.from(await image.arrayBuffer());
        const uploadDirPath = join(process.cwd(), "public", uploadDir);
        await writeFile(`${uploadDirPath}/${image.name}`, buffer);
        fileUrl = `${uploadDir}/${image.name}`;
      } else {
        fileUrl = null;
      }

      const response = await updateWorkspace(userId, workspaceId, {
        name,
        ...((image instanceof File || !image) && { image: fileUrl }),
      });

      return c.json({ data: response });
    }
  )
  .delete("/:workspaceId", async (c) => {
    const userId = await getSessionUserId(c);
    if (!userId) {
      throw new HTTPException(401, { message: "Custom error message" });
    }
    const { workspaceId } = c.req.param();
    const workspace = await deleteWorkspace(workspaceId, userId);
    return c.json({ data: workspace });
  });

export default app;
