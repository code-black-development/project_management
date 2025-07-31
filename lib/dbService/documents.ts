import prisma from "@/prisma/prisma";

export const getWorkspaceDocuments = async (workspaceId: string) => {
  return await prisma.taskAsset.findMany({
    where: {
      task: {
        workspaceId: workspaceId,
      },
    },
    include: {
      task: {
        select: {
          id: true,
          name: true,
          project: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getDocumentById = async (documentId: string) => {
  return await prisma.taskAsset.findUnique({
    where: {
      id: documentId,
    },
    include: {
      task: {
        select: {
          id: true,
          name: true,
          workspaceId: true,
          project: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });
};
