import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { parse } from "../../shared/validation";
import { recordActivity } from "./activity";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

const short = z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9_:.-]+$/);
// Only these few kinds of event, each with a few short facts. There is no place to send text a student wrote.
const eventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("guide_opened"), guide: short }).strict(),
  z.object({ type: z.literal("guide_closed"), guide: short, step: z.number().int().min(0).max(60), total: z.number().int().min(1).max(60), completed: z.boolean() }).strict(),
  z.object({ type: z.literal("tool_opened"), tool: short }).strict(),
  z.object({ type: z.literal("client_error"), code: short }).strict(),
]);

const limit = rateLimit({ windowMs: 60_000, limit: 120, keyGenerator: (req) => req.user!.id, standardHeaders: true, legacyHeaders: false, message: { success: false, code: "TOO_MANY", message: "Too many events" } });

analyticsRouter.post("/events", limit, (req, res) => {
  const { type, ...meta } = parse(eventSchema, req.body);
  recordActivity({ type, userId: req.user!.id, meta });
  res.status(204).end();
});
