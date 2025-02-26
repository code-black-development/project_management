import prisma from "@/prisma/prisma";
import { Worklog } from "@prisma/client";

type WorklogInput = Omit<Worklog, "id" | "createdAt" | "updatedAt">;
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
