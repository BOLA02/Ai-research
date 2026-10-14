import { z } from "zod";

const person = z.object({ family: z.string().trim().min(1).max(200), given: z.string().trim().max(200).optional() }).strict();

/** Empty strings and nulls both mean "not set". */
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

const number = (min: number, max: number) => z.number().int().min(min).max(max).nullish();

const fields = {
  type: z.enum(["BOOK", "BOOK_CHAPTER", "JOURNAL", "CONFERENCE", "WEBSITE", "THESIS", "REPORT", "STANDARD", "PATENT", "OTHER"]),
  authors: z.array(person).max(30).default([]),
  editors: z.array(person).max(30).default([]),
  title: z.string().trim().min(1).max(1000),
  containerTitle: text(500),
  year: number(1000, 2200),
  month: number(1, 12),
  day: number(1, 31),
  volume: text(30),
  issue: text(30),
  pages: text(40),
  edition: text(30),
  publisher: text(300),
  place: text(200),
  institution: text(300),
  degree: text(100),
  number: text(100),
  url: text(2000),
  doi: text(200),
};

export const sourceCreateSchema = z
  .object({ ...fields, citeKey: z.string().trim().regex(/^[A-Za-z0-9_-]{1,60}$/, "Use letters, numbers, - and _ only").optional() })
  .strict();

// The key is used in the text, so it cannot be renamed after creation.
export const sourceUpdateSchema = z
  .object(fields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");
