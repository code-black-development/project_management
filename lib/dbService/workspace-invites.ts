import prisma from "@/prisma/prisma";
import { generateCode } from "../utils";

export const createWorkspaceInvites = async (
  workspaceId: string,
  invites: string[]
) => {
  console.log("createWorkspaceInvites called with:", { workspaceId, invites });
  
  const data = invites.map((invite) => ({
    code: generateCode(10),
    workspaceId,
    inviteeEmail: invite,
  }));
  
  console.log("Prepared data for database:", data);
  
  return await prisma.workspaceInvites.createManyAndReturn({
    data,
  });
};

export const getWorkspaceInvitesByUserId = async (inviteeEmail: string) => {
  return await prisma.workspaceInvites.findMany({
    where: {
      inviteeEmail,
    },
  });
};

export const getWorkspaceInvite = async (code: string) => {
  console.log("code", code);
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
