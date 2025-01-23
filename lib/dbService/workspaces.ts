import prisma from "@/prisma/prisma";

import { Workspace } from "@prisma/client";

export const createWorkspace = async (
  name: string,
  fileUrl: string | null,
  userId: string
) => {
  try {
    const workspace = await prisma.workspace.create({
      data: {
        name,
        image: fileUrl,
        userId,
      },
    });
    console.log("workspace", workspace);
    return workspace;
  } catch (e) {
    console.error(e);
    throw new Error("Error creating workspace");
  }
};

export const getWorkspaceByUserId = async (userId: string) => {
  const workspace = await prisma.workspace.findMany({
    where: {
      userId,
    },
  });
  return workspace;
};

export const getWorkspaceById = async (workspaceId: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: {
      id: workspaceId,
    },
  });
  return workspace;
};

export const updateWorkspace = async (
  data: Omit<Workspace, "createdAt" | "updatedAt">
) => {
  const workspace = await prisma.workspace.update({
    where: {
      id: data.id,
    },
    data,
  });
  return workspace;
};

export const deleteWorkspace = async (workspaceId: string) => {
  const workspace = await prisma.workspace.delete({
    where: {
      id: workspaceId,
    },
  });
  return workspace;
};
