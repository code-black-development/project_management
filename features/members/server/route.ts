import { authMiddleware } from "@/features/auth/server/authMiddleware";
import {
  deleteMember,
  getMembersByWorkspaceId,
} from "@/lib/dbService/workspace-members";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const app = new Hono()
  .get("/", authMiddleware, async (c) => {
    const workspaces = await getMembersByWorkspaceId(workspaceId);
    return c.json({ data: workspaces });
  })
  .delete(
    "/",
    authMiddleware,
    zValidator("json", { memberId: z.string(), workspaceId: z.string() }),
    async (c) => {
      const { memberId, workspaceId } = c.req.valid("json");
      await deleteMember(memberId, workspaceId);
      return c.json({ message: "Member deleted" });
    }
  );

export default app;
