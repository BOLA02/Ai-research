import { z } from "zod";
import { TEMPLATE_IDS } from "../../templates";
export const projectCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(500),
    institution: z.string().trim().max(255).optional().default(""),
    department: z.string().trim().max(255).optional().default(""),
    programme: z.string().trim().max(255).optional().default(""),
    projectType: z.string().trim().max(100).optional().default(""),
    referenceStyle: z.enum(["IEEE", "APA"]).optional().default("IEEE"),
    templateId: z.enum(TEMPLATE_IDS).optional(),
  })
  .strict();
export const projectUpdateSchema = projectCreateSchema
  .omit({ templateId: true })
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );
