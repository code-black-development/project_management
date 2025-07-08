import { getWorkspaceInvite } from "@/lib/dbService/workspace-invites";
import prisma from "@/prisma/prisma";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import bcrypt from "bcrypt";

import { z } from "zod";

const app = new Hono().post(
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
);

export default app;
