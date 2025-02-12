import prisma from "@/prisma/prisma";

export const getMembersByWorkspaceId = async (workspaceId: string) => {
  return await prisma.members.findMany({
    where: {
      workspaceId,
    },
  });
};

export const getMemberById = async (userId: string, workspaceId: string) => {
  return await prisma.members.findUnique({
    where: {
      memberId: {
        userId,
        workspaceId,
      },
    },
  });
};

/** members get the role: member by default due to db schema */
export const addMember = async (userId: string, workspaceId: string) => {
  return await prisma.members.create({
    data: {
      userId,
      workspaceId,
    },
  });
};

export const deleteMember = async (userId: string, workspaceId: string) => {
  return await prisma.members.delete({
    where: {
      memberId: {
        userId,
        workspaceId,
      },
    },
  });
};

export const getMembersbyUserId = async (userId: string) => {
  return await prisma.members.findMany({
    where: {
      userId,
    },
  });
};

export const deleteAllMembersByUserId = async (userId: string) => {
  return await prisma.members.deleteMany({
    where: {
      userId,
    },
  });
};

export const checkIfUserIsAdmin = async (
  userId: string,
  workspaceId: string
) => {
  const member = await getMemberById(userId, workspaceId);
  return !!(member && member.role === "admin");
};
