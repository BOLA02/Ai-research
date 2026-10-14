import { z } from "zod";
import { TEMPLATE_IDS } from "../../templates";
/** Empty strings and nulls both mean "not set". */
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

const fields = {
  title: z.string().trim().min(1).max(500),
  institution: z.string().trim().max(255),
  department: z.string().trim().max(255),
  programme: z.string().trim().max(255),
  projectType: z.string().trim().max(100),
  referenceStyle: z.enum(["IEEE", "APA"]),
  studentName: text(200),
  registrationNumber: text(60),
  supervisorNames: text(500),
  coordinatorName: text(200),
  hodName: text(200),
  externalExaminerName: text(200),
  school: text(200),
  college: text(200),
  graduationYear: z.number().int().min(1990).max(2100).nullish(),
};

export const projectCreateSchema = z
  .object({
    ...fields,
    institution: fields.institution.optional().default(""),
    department: fields.department.optional().default(""),
    programme: fields.programme.optional().default(""),
    projectType: fields.projectType.optional().default(""),
    referenceStyle: fields.referenceStyle.optional().default("IEEE"),
    templateId: z.enum(TEMPLATE_IDS).optional(),
  })
  .strict();

// An update changes only the fields it names. It must not inherit the create defaults,
// or every update would reset the style, institution and department.
export const projectUpdateSchema = z
  .object(fields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");
