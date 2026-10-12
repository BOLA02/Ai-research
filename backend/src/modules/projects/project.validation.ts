import { z } from "zod";
export const projectCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(500),
    institution: z.string().trim().max(255).optional().default(""),
    department: z.string().trim().max(255).optional().default(""),
    programme: z.string().trim().max(255).optional().default(""),
    projectType: z.string().trim().max(100).optional().default(""),
    referenceStyle: z.string().trim().min(1).max(30).optional().default("IEEE"),
  })
  .strict();
export const projectUpdateSchema = projectCreateSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );
