import { z } from "zod";

export const workspaceSchema = z.object({
  name: z.string().trim().nonempty("Name is required"),
  image: z
    .union([
      z.instanceof(File),
      z.string().transform((val) => (val === "" ? undefined : val)),
    ])
    .optional(),
});
