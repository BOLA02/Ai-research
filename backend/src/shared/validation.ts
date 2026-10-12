import { z } from "zod";
import { AppError } from "./errors";
export const uuidSchema = z.string().uuid();
export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Request validation failed",
      result.error.flatten(),
    );
  return result.data;
}
