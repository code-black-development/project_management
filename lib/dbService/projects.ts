import prisma from "@/prisma/prisma";

export const getProjectsByWorkspaceId = async (workspaceId: string) => {
  try {
    const result = await prisma.project.findMany({
      where: {
        workspaceId,
      },
    });
    return result;
  } catch (e) {
    console.error(JSON.stringify(e));
    throw new Error("Error deleting workspace");
  }
};

export const getProjectById = async (projectId: string) => {
  return await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });
};

export const createProject = async (data: {
  name: string;
  workspaceId: string;
  image?: string | null;
}) => {
  return await prisma.project.create({
    data,
  });
};

export const updateProject = async (
  projectId: string,
  data: {
    name: string;
    image?: string | null;
  }
) => {
  return await prisma.project.update({
    where: {
      id: projectId,
    },
    data,
  });
};

export const deleteProject = async (projectId: string) => {
  return await prisma.project.delete({
    where: {
      id: projectId,
    },
  });
};
