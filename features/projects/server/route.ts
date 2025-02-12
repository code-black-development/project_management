import { getSessionUserId } from "@/lib/authFunctions";
import { getProjectsByWorkspaceId } from "@/lib/dbService/projects";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

const app = new Hono().get(
  "/",
  zValidator("query", z.object({ workspaceId: z.string() })),
  async (c) => {
    const userId = await getSessionUserId(c);
    if (!userId) {
      throw new HTTPException(401, { message: "Custom error message" });
    }
    //TODO: we should check member is allowed to access this workspace's projects
    const projects = await getProjectsByWorkspaceId(
      c.req.valid("query").workspaceId
    );
  }
);

export default app;
