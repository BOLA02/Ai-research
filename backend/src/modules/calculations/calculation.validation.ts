import { z } from "zod";
import { LABEL_PATTERN } from "../../shared/labels";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

const variable = z.object({ symbol: z.string().trim().max(40), name: z.string().trim().max(100).optional(), value: z.string().trim().max(40), unit: z.string().trim().max(12).optional() }).strict();
const step = z
  .object({ symbol: z.string().trim().max(40), name: z.string().trim().max(100).optional(), expression: z.string().max(300), unit: z.string().trim().max(12).optional(), decimals: z.number().int().min(0).max(8).nullish() })
  .strict();

const fields = {
  title: z.string().trim().min(1).max(300),
  sectionId: z.string().uuid().nullish(),
  note: text(500),
  variables: z.array(variable).max(30),
  steps: z.array(step).max(20),
};

export const calculationCreateSchema = z
  .object({ ...fields, variables: fields.variables.default([]), steps: fields.steps.default([]), label: z.string().regex(LABEL_PATTERN).optional() })
  .strict();

// The label is used in the text, so it cannot be renamed after creation.
export const calculationUpdateSchema = z
  .object(fields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const calculationPreviewSchema = z.object({ variables: fields.variables, steps: fields.steps, note: fields.note }).strict();
