import prisma from "@/prisma/prisma";

export const getUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: {
      email,
    },
  });
};

export const createUser = async (email: string, password: string) => {
  return await prisma.user.create({
    data: {
      email,
      password,
    },
  });
};

export const getUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: {
      id,
    },
  });
};

export const updateUser = async (id: string, data: { name?: string }) => {
  return await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
};
