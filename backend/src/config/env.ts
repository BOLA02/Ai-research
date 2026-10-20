import "dotenv/config";
import { z } from "zod";
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  // Number of reverse proxies in front of the API (Railway adds one). Needed so rate limits see the real client address.
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
  // Password-reset email. Without RESEND_API_KEY the link is printed to the server log instead (development only).
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().min(3).default("ProjectForge <onboarding@resend.dev>"),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().min(5).max(1440).default(60),
  // Figure images are stored on Cloudinary when all three are set; otherwise they are kept in the database.
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  // Comma-separated emails that can open the admin panel, for example ADMIN_EMAILS=you@example.com
  ADMIN_EMAILS: z.string().default(""),
  SESSION_TTL_HOURS: z.coerce.number().positive().max(168).default(8),
  SESSION_COOKIE_NAME: z.string().min(1).default("pf_session"),
  // The writing coach is switched on by setting an API key. The SDK reads ANTHROPIC_BASE_URL itself.
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL: z.string().min(1).default("claude-sonnet-5-5"),
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
const production = parsed.data.NODE_ENV === "production";
if (production && !process.env.FRONTEND_URL && !process.env.FRONTEND_ORIGIN)
  throw new Error("FRONTEND_URL must be set in production");
export const env = parsed.data;
