import { z } from "zod";
export const profileUpdateSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );
const answer = z.union([z.literal(0), z.literal(1), z.literal(2)]);
export const onboardingSchema = z
  .object({ answers: z.tuple([answer, answer, answer]).optional() })
  .strict();
