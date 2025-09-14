import prisma from "@/prisma/prisma";
import { Worklog } from "@prisma/client";

type WorklogInput = Omit<Worklog, "id" | "createdAt" | "updatedAt">;
type WorklogUpdateInput = Partial<Omit<Worklog, "id" | "createdAt" | "updatedAt">>;

export const createTaskWorklog = async (
  worklog: WorklogInput
): Promise<Worklog> => {
  try {
    return await prisma.worklog.create({
      data: worklog,
    });
  } catch (e) {
    console.log(JSON.stringify(e));
    throw new Error("Failed to create worklog");
  }
};

export const updateTaskWorklog = async (
  worklogId: string,
  worklog: WorklogUpdateInput
): Promise<Worklog> => {
  try {
    return await prisma.worklog.update({
      where: { id: worklogId },
      data: worklog,
    });
  } catch (e) {
    console.log(JSON.stringify(e));
    throw new Error("Failed to update worklog");
  }
};

export const deleteTaskWorklog = async (
  worklogId: string
): Promise<Worklog> => {
  try {
    return await prisma.worklog.delete({
      where: { id: worklogId },
    });
  } catch (e) {
    console.log(JSON.stringify(e));
    throw new Error("Failed to delete worklog");
  }
};

export const getWorklogById = async (
  worklogId: string
) => {
  try {
    return await prisma.worklog.findUnique({
      where: { id: worklogId },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
    });
  } catch (e) {
    console.log(JSON.stringify(e));
    throw new Error("Failed to get worklog");
  }
};
