import { z } from "zod";
import { TaskStatus, TaskType, RecurrenceFrequency, RecurrenceDuration } from "@prisma/client";

export const createTaskSchema = z.object({
  name: z.string().trim().nonempty("Name is required"),
  status: z.nativeEnum(TaskStatus, { required_error: "Required" }),
  workspaceId: z.string().nonempty("Workspace is required"),
  projectId: z.string().nonempty("Project is required"),
  taskType: z.nativeEnum(TaskType).optional().default(TaskType.TASK),
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
  isRecurring: z.boolean().optional().default(false),
  recurrenceFrequency: z.nativeEnum(RecurrenceFrequency).nullable().optional(),
  recurrenceDuration: z.nativeEnum(RecurrenceDuration).nullable().optional(),
  recurrenceEndDate: z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .transform((val) => (!val || val === "" ? null : val)),
});

export const updateTaskSchema = z.object({
  name: z.string().trim().nonempty("Name is required"),
  status: z.nativeEnum(TaskStatus, { required_error: "Required" }),
  workspaceId: z.string().nonempty("Workspace is required"),
  projectId: z.string().nonempty("Project is required"),
  taskType: z.nativeEnum(TaskType).optional().default(TaskType.TASK),
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
  isRecurring: z.boolean().optional().default(false),
  recurrenceFrequency: z.nativeEnum(RecurrenceFrequency).nullable().optional(),
  recurrenceDuration: z.nativeEnum(RecurrenceDuration).nullable().optional(),
  recurrenceEndDate: z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .transform((val) => (!val || val === "" ? null : val)),
});

export const patchTaskSchema = z.object({
  name: z.string().trim().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  workspaceId: z.string().optional(),
  projectId: z.string().optional(),
  taskType: z.nativeEnum(TaskType).optional(),
  categoryId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  timeEstimate: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || /^(\d+[wdhm]\s?)+$/.test(val), {
      message: "invalid format (use: 1w 2d 3h 4m)",
    })
    .transform((val) => (val === "" ? null : val)),
  dueDate: z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  assigneeId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  description: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  isRecurring: z.boolean().optional(),
  recurrenceFrequency: z.nativeEnum(RecurrenceFrequency).nullable().optional(),
  recurrenceDuration: z.nativeEnum(RecurrenceDuration).nullable().optional(),
  recurrenceEndDate: z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
});

export const taskSearchSchema = z.object({
  workspaceId: z.string().nullish(),
  projectId: z.string().nullish(),
  assigneeId: z.string().nullish(),
  status: z.nativeEnum(TaskStatus).nullish(),
  search: z.string().nullish(),
  dueDate: z.coerce.date().nullish(),
  limit: z.coerce.number().int().min(1).max(500).default(250),
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

export const updateWorklogSchema = z.object({
  timeSpent: z
    .string()
    .min(1, "Time entry cannot be empty")
    .refine((val) => /^(\d+[wdhm]\s?)+$/.test(val), {
      message:
        "Time must be in valid format (e.g., '2h 30m', '1d 4h', '1w 2d 3h 15m')",
    })
    .optional(),
  dateWorked: z.date().optional(),
  workDescription: z.string().optional(),
});

export const createEventSchema = createTaskSchema.extend({
  taskType: z.literal(TaskType.EVENT),
  dueDate: z
    .union([z.string(), z.date()])
    .refine((val) => val !== null && val !== "", {
      message: "Due date is required for events",
    }),
}).refine(
  (data) => {
    if (data.isRecurring) {
      // If recurring, require frequency
      if (!data.recurrenceFrequency) {
        return false;
      }
      // If duration is CUSTOM, require end date
      if (data.recurrenceDuration === RecurrenceDuration.CUSTOM && !data.recurrenceEndDate) {
        return false;
      }
    }
    return true;
  },
  {
    message: "Recurring events require frequency and duration settings",
    path: ["isRecurring"],
  }
);
