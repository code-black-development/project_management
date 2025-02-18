import prisma from "@/prisma/prisma";
import { Context } from "hono";

//this function will return from the route if the logged in user is not an admin of the workspace
export const onlyWorkspaceMember = async (
  c: Context,
  userId: string,
  workspaceId: string,
  adminOnly = false
) => {
  const user = await prisma.member.findFirst({
    where: {
      workspaceId,
      userId,
      ...(adminOnly && { role: "admin" }),
    },
  });
  if (!user) {
    return c.json({ error: "You are not an admin of this workspace" }, 403);
  }
};
