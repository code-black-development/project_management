import { getWorkspaceInvite } from "@/lib/dbService/workspace-invites";
import prisma from "@/prisma/prisma";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import bcrypt from "bcrypt";

import { z } from "zod";

const app = new Hono()
  .post(
    "/register",
    zValidator(
      "json",
      z.object({
        password: z.string(),
        inviteCode: z.string(),
      })
    ),
    async (c) => {
      const { password, inviteCode } = c.req.valid("json");
      // check for invitation code
      const invitee = await getWorkspaceInvite(inviteCode);
      if (!invitee) {
        return c.json({ error: "Invalid invite code" }, 400);
      }
      const user = await prisma.$transaction(async (tx) => {
        //add user to users table
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await tx.user.create({
          data: {
            email: invitee.inviteeEmail,
            password: hashedPassword,
          },
        });
        //add user to workspace members table
        await tx.member.create({
          data: {
            userId: user.id,
            workspaceId: invitee.workspaceId,
          },
        });

        //remove entry from invites table
        await tx.workspaceInvites.delete({
          where: {
            code: inviteCode,
          },
        });

        return user;
      });
      return c.json({ data: user });
    }
  )
  .patch(
    "/profile",
    zValidator(
      "json",
      z.object({
        name: z.string().min(1, "Name is required"),
      })
    ),
    async (c) => {
      const { name } = c.req.valid("json");
      const userId = c.get("userId");

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      try {
        const user = await prisma.user.update({
          where: { id: userId },
          data: { name },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        return c.json({ data: user });
      } catch (error) {
        console.error("Failed to update user profile:", error);
        return c.json({ error: "Failed to update profile" }, 500);
      }
    }
  );

export default app;
