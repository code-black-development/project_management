import { z } from "zod";
import { TaskStatus } from "@prisma/client";

export const createTaskSchema = z.object({
  name: z.string().trim().nonempty("Name is required"),
  status: z.nativeEnum(TaskStatus, { required_error: "Required" }),
  workspaceId: z.string().nonempty("Workspace is required"),
  projectId: z.string().nonempty("Project is required"),
  categoryId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (!val || val === "" ? null : val)),
  timeEstimate: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || val === "" || /^(\d+[wdhm]\s?)+$/.test(val), {
      message: "invalid format (use: 1w 2d 3h 4m)",
    })
    .transform((val) => (!val || val === "" ? null : val)),
  dueDate: z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .transform((val) => (!val || val === "" ? null : val)),
  assigneeId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (!val || val === "" ? null : val)),
  description: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (!val || val === "" ? null : val)),
});

export const updateTaskSchema = z.object({
  name: z.string().trim().nonempty("Name is required"),
  status: z.nativeEnum(TaskStatus, { required_error: "Required" }),
  workspaceId: z.string().nonempty("Workspace is required"),
  projectId: z.string().nonempty("Project is required"),
  categoryId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (!val || val === "" ? null : val)),
  timeEstimate: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || val === "" || /^(\d+[wdhm]\s?)+$/.test(val), {
      message: "invalid format (use: 1w 2d 3h 4m)",
    })
    .transform((val) => (!val || val === "" ? null : val)),
  dueDate: z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .transform((val) => (!val || val === "" ? null : val)),
  assigneeId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (!val || val === "" ? null : val)),
  description: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (!val || val === "" ? null : val)),
});

export const patchTaskSchema = z.object({
  name: z.string().trim().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  workspaceId: z.string().optional(),
  projectId: z.string().optional(),
  categoryId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val || null),
  timeEstimate: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || /^(\d+[wdhm]\s?)+$/.test(val), {
      message: "invalid format (use: 1w 2d 3h 4m)",
    })
    .transform((val) => val || null),
  dueDate: z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .transform((val) => val || null),
  assigneeId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val || null),
  description: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val || null),
});

export const taskSearchSchema = z.object({
  workspaceId: z.string().nullish(),
  projectId: z.string().nullish(),
  assigneeId: z.string().nullish(),
  status: z.nativeEnum(TaskStatus).nullish(),
  search: z.string().nullish(),
  dueDate: z.date().nullish(),
});

export const createWorklogSchema = z.object({
  timeSpent: z
    .string()
    .min(1, "Time entry cannot be empty")
    .refine((val) => /^(\d+[wdhm]\s?)+$/.test(val), {
      message:
        "Time must be in valid format (e.g., '2h 30m', '1d 4h', '1w 2d 3h 15m')",
    }),
  dateWorked: z.date(),
  workDescription: z.string().optional(),
});
