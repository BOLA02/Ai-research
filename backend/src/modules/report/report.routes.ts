import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { parse, uuidSchema } from "../../shared/validation";
import { recordActivity } from "../activity";
import * as service from "./report.service";

const resolveSchema = z.object({ text: z.string().max(200_000) }).strict();
const id = (value: string | string[] | undefined) => parse(uuidSchema, Array.isArray(value) ? value[0] : value);

export const reportRouter = Router();
reportRouter.use(requireAuth);

reportRouter.get("/:projectId/report/index", async (req, res) =>
  res.json({ success: true, data: { index: await service.getIndex(req.user!.id, id(req.params.projectId)) } }),
);
reportRouter.post("/:projectId/report/resolve", async (req, res) =>
  res.json({ success: true, data: { text: await service.resolve(req.user!.id, id(req.params.projectId), parse(resolveSchema, req.body).text) } }),
);
reportRouter.get("/:projectId/report/checks", async (req, res) => {
  const projectId = id(req.params.projectId);
  const data = await service.getChecks(req.user!.id, projectId);
  // Which checks students fail most often shows where they need more help. Only the check names are kept.
  const open = data.checks.filter((check) => check.severity !== "ok");
  // Only when a student opens the Checks page, not when another page reads the counts.
  if (req.query.track === "1") recordActivity({ type: "checks_run", userId: req.user!.id, projectId, meta: { errors: open.filter((c) => c.severity === "error").length, warnings: open.filter((c) => c.severity === "warning").length, open: open.map((c) => c.id).join(",").slice(0, 300) } });
  res.json({ success: true, data });
});
