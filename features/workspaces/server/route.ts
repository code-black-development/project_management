import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { workspaceSchema } from "../schemas";
import { HTTPException } from "hono/http-exception";
import { join } from "path";
import { writeFile } from "fs/promises";
import {
  createWorkspace,
  getWorkspaceByUserId,
  getWorkspaces,
} from "@/lib/dbService/workspaces";
import { getSessionUserId } from "@/lib/authFunctions";

const app = new Hono()
  .get("/", async (c) => {
    const userId = await getSessionUserId(c);
    if (!userId) {
      throw new HTTPException(401, { message: "Custom error message" });
    }
    const workspaces = await getWorkspaceByUserId(userId);
    return c.json({ data: workspaces });
  })
  .post("/", zValidator("form", workspaceSchema), async (c) => {
    const userId = await getSessionUserId(c);
    if (!userId) {
      throw new HTTPException(401, { message: "Custom error message" });
    }
    const { name, image } = c.req.valid("form");

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
      console.log("fileUrl", fileUrl);
    }

    const workspaces = await createWorkspace(name, fileUrl, userId!);
    console.log("workspaces", workspaces);
    return c.json({ data: workspaces });
  });

export default app;
