import prisma from "@/prisma/prisma";
import { Member } from "@prisma/client";

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

/** members get the role: member by default due to db schema */
export const addMember = async (data: Partial<Member>) => {
  return await prisma.member.create({
    data,
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
