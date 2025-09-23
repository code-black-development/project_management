import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().nonempty("Name is required"),
  image: z
    .union([
      z.instanceof(File),
      z.string().transform((val) => (val === "" ? undefined : val)),
    ])
    .optional(),
  workspaceId: z.string(),
  autoHideCompletedTasks: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  autoHideChildTasks: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  taskAssignmentEmail: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});
export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, "Must be at least one character"),
  image: z
    .union([
      z.instanceof(File),
      z.string().transform((val) => (val === "" ? undefined : val)),
    ])
    .optional(),
  autoHideCompletedTasks: z.boolean().optional(),
  autoHideChildTasks: z.boolean().optional(),
  taskAssignmentEmail: z.boolean().optional(),
});
