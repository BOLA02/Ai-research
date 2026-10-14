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
  // The writing coach is switched on by setting an API key. The SDK reads ANTHROPIC_BASE_URL itself.
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL: z.string().min(1).default("claude-opus-5-5"),
  AI_DAILY_LIMIT: z.coerce.number().int().min(1).max(500).default(20),
  AI_BURST_PER_MINUTE: z.coerce.number().int().min(1).max(60).default(6),
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
