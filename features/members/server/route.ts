import {
  deleteMember,
  getMembersByWorkspaceId,
  checkIfUserIsAdmin,
  getMemberById,
} from "@/lib/dbService/workspace-members";

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { z } from "zod";
import prisma from "@/prisma/prisma";

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
  .patch(
    "/:memberId/username",
    zValidator("param", z.object({ memberId: z.string() })),
    zValidator("json", z.object({ name: z.string().min(1), workspaceId: z.string() })),
    async (c) => {
      const userId = c.get("userId");
      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { memberId } = c.req.valid("param");
      const { name, workspaceId } = c.req.valid("json");

      const isAdmin = await checkIfUserIsAdmin(userId, workspaceId);
      if (!isAdmin) {
        return c.json({ error: "Forbidden" }, 403);
      }

      const member = await getMemberById(memberId);
      if (!member || member.workspaceId !== workspaceId) {
        return c.json({ error: "Member not found" }, 404);
      }

      const user = await prisma.user.update({
        where: { id: member.userId },
        data: { name: name.trim() },
        select: { id: true, name: true, email: true },
      });

      return c.json({ data: user });
    }
  )
  .delete(
    "/:memberId",
    zValidator("param", z.object({ memberId: z.string() })),
    async (c) => {
      const { memberId } = c.req.valid("param");
      await deleteMember(memberId);
      return c.json({ message: "Member deleted" });
    }
  );

export default app;
