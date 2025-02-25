import prisma from "@/prisma/prisma";

export const getMembersByWorkspaceId = async (workspaceId: string) => {
  return await prisma.member.findMany({
    where: {
      workspaceId,
    },
    include: {
      user: true,
    },
  });
};

export const getMemberById = async (id: string) => {
  return await prisma.member.findUnique({
    where: {
      id,
    },
  });
};

export const getMemberByUserIdAndWorkspaceId = async (
  userId: string,
  workspaceId: string
) => {
  return await prisma.member.findFirst({
    where: {
      userId,
      workspaceId,
    },
  });
};

/** members get the role: member by default due to db schema */
export const addMember = async (userId: string, workspaceId: string) => {
  return await prisma.member.create({
    data: {
      userId,
      workspaceId,
    },
  });
};

export const deleteMember = async (id: string) => {
  return await prisma.member.delete({
    where: {
      id,
    },
  });
};

export const getMembersbyUserId = async (userId: string) => {
  return await prisma.member.findMany({
    where: {
      userId,
    },
  });
};

export const deleteAllMembersByUserId = async (userId: string) => {
  return await prisma.member.deleteMany({
    where: {
      userId,
    },
  });
};

export const checkIfUserIsAdmin = async (
  userId: string,
  workspaceId: string
) => {
  const member = await prisma.member.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  return !!(member && member.role === "admin");
};
