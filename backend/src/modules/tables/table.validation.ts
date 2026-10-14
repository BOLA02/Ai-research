import { z } from "zod";
import { LABEL_PATTERN } from "../../shared/labels";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

const cell = z.string().max(500);
const fields = {
  caption: z.string().trim().min(1).max(1000),
  sectionId: z.string().uuid().nullish(),
  sourceNote: text(1000),
  columns: z.array(z.string().trim().max(200)).min(1).max(12),
  rows: z.array(z.array(cell).max(12)).max(200),
};

const rectangular = (value: { columns?: string[]; rows?: string[][] }) =>
  !value.columns || !value.rows || value.rows.every((row) => row.length === value.columns!.length);
const message = { message: "Every row needs one cell for each column" };

export const tableCreateSchema = z
  .object({ ...fields, columns: fields.columns.default(["Column 1", "Column 2"]), rows: fields.rows.default([["", ""]]), label: z.string().regex(LABEL_PATTERN).optional() })
  .strict()
  .refine(rectangular, message);

export const tableUpdateSchema = z
  .object(fields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required")
  .refine(rectangular, message);
