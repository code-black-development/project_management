import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { workspaceSchema } from "../schemas";
import { getAuth } from "@hono/clerk-auth";

const app = new Hono()
  .post("/", zValidator("json", workspaceSchema), async (c) => {
    return c.json({ workspaces: [] });
  })
  .get("/hello", async (c) => {
    const auth = await getAuth(c);
    if (!auth?.userId) {
      return c.json({ hello: "stranger" });
    }
    return c.json({ hello: auth.userId });
  });

export default app;
