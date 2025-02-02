import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { workspaceSchema } from "../schemas";
import { getAuth } from "@hono/clerk-auth";
import prisma from "@/prisma/prisma";

const app = new Hono()
  .get("/", zValidator("json", workspaceSchema), async (c) => {
    return c.json({ workspaces: [] });
  })
  .post("/", zValidator("json", workspaceSchema), async (c) => {
    const auth = await getAuth(c);
    if (!auth?.userId) {
      //return 401
    }
    const { name, image } = c.req.valid("json");
    let uploadedImageUrl: string | undefined;
    if (image instanceof File) {
    }
    const ws = await prisma.workspace.create({
      data: { userId: auth?.userId!, name },
    });
    return c.json({ data: ws });
  });

export default app;
