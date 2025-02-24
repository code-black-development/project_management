import { z } from "zod";
import { TaskStatus } from "@prisma/client";

export const createTaskSchema = z.object({
  name: z.string().trim().nonempty("Name is required"),
  status: z.nativeEnum(TaskStatus, { required_error: "Required" }),
  workspaceId: z.string().nonempty("Workspace is required"),
  projectId: z.string().nonempty("Project is required"),
  timeEstimate: z
    .string()
    .regex(/^(\d+[wdhm]\s?)+$/, { message: "invalid format" }) // 1w 2d 3h 4m
    .optional()
    .transform((val) => val ?? null),
  dueDate: z
    .date()
    .optional()
    .transform((val) => val || null), //prisma expects no value to be null not undefined.
  assigneeId: z
    .string()
    .optional()
    .transform((val) => val || null),
  description: z
    .string()
    .optional()
    .transform((val) => val || null),
});

export const updateTaskSchema = z.object({
  name: z.string().trim().nonempty("Name is required"),
  status: z.nativeEnum(TaskStatus, { required_error: "Required" }),
  workspaceId: z.string().nonempty("Workspace is required"),
  projectId: z.string().nonempty("Project is required"),
  timeEstimate: z
    .string()
    .regex(/^(\d+[wdhm]\s?)+$/, { message: "invalid format" })
    .optional()
    .transform((val) => val ?? null),
  dueDate: z
    .date()
    .optional()
    .transform((val) => val ?? null), //prisma expects no value to be null not undefined.
  assigneeId: z
    .string()
    .optional()
    .transform((val) => val ?? null),
  description: z
    .string()
    .optional()
    .transform((val) => val ?? null),
});

export const taskSearchSchema = z.object({
  workspaceId: z.string().nullish(),
  projectId: z.string().nullish(),
  assigneeId: z.string().nullish(),
  status: z.nativeEnum(TaskStatus).nullish(),
  search: z.string().nullish(),
  dueDate: z.date().nullish(),
});
