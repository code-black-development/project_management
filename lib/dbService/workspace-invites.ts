import prisma from "@/prisma/prisma";
import { generateCode } from "../utils";

export const createWorkspaceInvite = async (
  workspaceId: string,
  userId: string
) => {
  return await prisma.workspaceInvites.create({
    data: {
      workspaceId,
      userId,
      code: generateCode(10),
    },
  });
};

export const getWorkspaceInvite = async (code: string) => {
  return await prisma.workspaceInvites.findUnique({
    where: {
      code,
    },
  });
};

export const deleteWorkspaceInvite = async (code: string) => {
  return await prisma.workspaceInvites.delete({
    where: {
      code,
    },
  });
};
