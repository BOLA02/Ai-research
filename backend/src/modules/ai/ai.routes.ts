import { Router } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/auth";
import { parse, uuidSchema } from "../../shared/validation";
import { reviewRequestSchema } from "./ai.schema";
import * as service from "./ai.service";

export const aiRouter = Router();

// A second guard on top of the daily allowance: no bursts of requests.
// It counts per student, not per address, so many students sharing one campus connection do not block each other.
const burst = rateLimit({ windowMs: 60_000, limit: env.AI_BURST_PER_MINUTE, keyGenerator: (req) => req.user!.id, standardHeaders: true, legacyHeaders: false, message: { success: false, code: "AI_TOO_FAST", message: "Please wait a moment before asking again." } });

aiRouter.get("/ai/status", requireAuth, async (req, res) => res.json({ success: true, data: await service.status(req.user!.id) }));

aiRouter.post("/projects/:projectId/ai/review", requireAuth, burst, async (req, res) => {
  const projectId = parse(uuidSchema, Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId);
  res.json({ success: true, data: await service.reviewText(req.user!.id, projectId, parse(reviewRequestSchema, req.body)) });
});
