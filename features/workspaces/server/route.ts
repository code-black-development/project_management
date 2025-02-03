import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { workspaceSchema } from "../schemas";
import { getAuth } from "@hono/clerk-auth";
import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import { createWorkspace, getWorkspaces } from "@/lib/dbService/workspaces";

const app = new Hono()
  .get("/", async (c) => {
    const workspaces = await getWorkspaces();
    return c.json({ data: workspaces });
  })
  .post("/", zValidator("json", workspaceSchema), async (c) => {
    const auth = await getAuth(c);
    if (!auth?.userId) {
      //TODO: return 401
    }
    const { name, image } = c.req.valid("json");
    let fileUrl: string | null = null;
    if (image instanceof File) {
      const uploadDir = "uploaded_files";

      //const image = (formData.get("image") as File) || null;
      const buffer = Buffer.from(await image.arrayBuffer());

      const uploadDirPath = join(process.cwd(), "public", uploadDir);
      await writeFile(`${uploadDirPath}/${image.name}`, buffer);
      fileUrl = `${uploadDir}/${image.name}`;
      console.log("fileUrl", fileUrl);
    }

    const workspaces = await createWorkspace(name, fileUrl, auth?.userId!);
    return c.json({ data: workspaces });
  });

export default app;
