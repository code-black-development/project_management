import prisma from "@/prisma/prisma";

/**
 *
 * @param name
 * @param fileUrl
 * @param userId
 * @returns
 *
 * This also needs to create a new admin workspace member with the user id and workspace id
 */
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
        user: userId,
        members: {
          create: {
            userId,
            role: "admin",
          },
        },
      },
    });
    return workspace;
  } catch (e) {
    console.error(e);
    throw new Error("Error creating workspace");
  }
};

export const getWorkspaces = async () => {
  return await prisma.workspace.findMany();
};

export const getWorkspaceByUserId = async (userId: string) => {
  const workspace = await prisma.workspace.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
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

//takes userId to ensure the user is allowed to update the workspace by looking at the members
export const updateWorkspace = async (
  userId: string,
  workspaceId: string,
  data: { name: string; image?: string | null }
) => {
  try {
    const workspace = await prisma.workspace.update({
      where: {
        id: workspaceId,
        members: {
          some: {
            userId,
            role: "admin",
          },
        },
      },
      data,
    });
    return workspace;
  } catch (e) {
    console.error(JSON.stringify(e));
    throw new Error("Error updating workspace");
  }
};
//TODO - delete the workspace members, projects and tasks as well
export const deleteWorkspace = async (workspaceId: string, userId: string) => {
  try {
    const workspace = await prisma.workspace.delete({
      where: {
        id: workspaceId,
        members: {
          some: {
            userId,
            role: "admin",
          },
        },
      },
    });
    return workspace;
  } catch (e) {
    console.error(JSON.stringify(e));
    throw new Error("Error deleting workspace");
  }
};
