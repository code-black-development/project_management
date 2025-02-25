import prisma from "@/prisma/prisma";

export const authUser = async (email: string, password: string) => {
  return await prisma.user.findFirst({
    where: {
      email,
      password,
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
