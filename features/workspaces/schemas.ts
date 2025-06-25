import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().trim().nonempty("Name is required"),
  image: z
    .union([
      z.instanceof(File),
      z.string().transform((val) => (val === "" ? undefined : val)),
    ])
    .optional(),
});
export const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(1, "Must be at least one character"),
  image: z
    .union([
      z.instanceof(File),
      z.string().transform((val) => (val === "" ? undefined : val)),
    ])
    .optional(),
});

export const createWorkspaceInvitesSchema = z.object({
  invites: z
    .array(z.string().email({ message: "Invalid email address" }))
    .min(1, { message: "At least one email is required" }),
});
