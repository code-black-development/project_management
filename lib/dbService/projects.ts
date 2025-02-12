import prisma from "@/prisma/prisma";

export const getProjectsByWorkspaceId = async (workspaceId: string) => {
  return await prisma.projects.findMany({
    where: {
      workspaceId,
    },
  });
};
