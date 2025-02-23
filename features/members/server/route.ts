import {
  deleteMember,
  getMembersByWorkspaceId,
} from "@/lib/dbService/workspace-members";

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { z } from "zod";

const app = new Hono()
  .get(
    "/",
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const { workspaceId } = c.req.valid("query");
      const members = await getMembersByWorkspaceId(workspaceId);
      return c.json({ data: members });
    }
  )
  .delete(
    "/",

    zValidator("json", { id: z.string(), workspaceId: z.string() }),
    async (c) => {
      const { memberId, workspaceId } = c.req.valid("json");
      await deleteMember(memberId, workspaceId);
      return c.json({ message: "Member deleted" });
    }
  );

export default app;
