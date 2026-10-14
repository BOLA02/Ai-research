import { z } from "zod";
import { LABEL_PATTERN } from "../../shared/labels";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

const fields = {
  caption: z.string().trim().min(1).max(1000),
  sectionId: z.string().uuid().nullish(),
  sourceNote: text(1000),
  isOriginal: z.boolean(),
  altText: text(500),
};

export const figureCreateSchema = z
  .object({ ...fields, isOriginal: fields.isOriginal.default(true), label: z.string().regex(LABEL_PATTERN).optional() })
  .strict();

// The label is used in the text, so it cannot be renamed after creation.
export const figureUpdateSchema = z
  .object(fields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");
