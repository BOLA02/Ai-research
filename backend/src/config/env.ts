import "dotenv/config";
import { z } from "zod";
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  SESSION_TTL_HOURS: z.coerce.number().positive().max(168).default(8),
  SESSION_COOKIE_NAME: z.string().min(1).default("pf_session"),
});
const parsed = schema.safeParse({
  ...process.env,
  FRONTEND_URL: process.env.FRONTEND_URL || process.env.FRONTEND_ORIGIN,
});
if (!parsed.success) {
  console.error(
    "Invalid environment configuration",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment configuration");
}
export const env = parsed.data;
