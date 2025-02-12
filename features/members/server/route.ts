import { getSessionUserId } from "@/lib/authFunctions";
import { getMembersByWorkspaceId } from "@/lib/dbService/workspace-members";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

const app = new Hono().get("/", async (c) => {
  const userId = await getSessionUserId(c);
  if (!userId) {
    throw new HTTPException(401, { message: "Custom error message" });
  }
  const workspaces = await getMembersByWorkspaceId(userId);
  return c.json({ data: workspaces });
});

export default app;
