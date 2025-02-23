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

    zValidator("param", z.object({ memberId: z.string() })),
    async (c) => {
      const { memberId } = c.req.valid("param");
      await deleteMember(memberId);
      return c.json({ message: "Member deleted" });
    }
  );

export default app;
