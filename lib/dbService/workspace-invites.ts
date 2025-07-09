import prisma from "@/prisma/prisma";
import { generateCode } from "../utils";

export const createWorkspaceInvites = async (
  workspaceId: string,
  invites: string[]
) => {
  return await prisma.workspaceInvites.createManyAndReturn({
    data: invites.map((invite) => ({
      code: generateCode(10),
      workspaceId,
      inviteeEmail: invite,
    })),
  });
};

export const getWorkspaceInvitesByEmail = async (inviteeEmail: string) => {
  return await prisma.workspaceInvites.findMany({
    where: {
      inviteeEmail,
    },
  });
};

export const getWorkspaceInvite = async (code: string) => {
  try {
    const res = await prisma.workspaceInvites.findUnique({
      where: {
        code,
      },
      include: {
        workspace: true,
      },
    });
    return res;
  } catch (e) {
    console.log(JSON.stringify(e));
    throw new Error("Failed to get workspace invite");
  }
};

export const deleteWorkspaceInvite = async (code: string) => {
  return await prisma.workspaceInvites.delete({
    where: {
      code,
    },
  });
};
