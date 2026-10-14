import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { parse, uuidSchema } from "../../shared/validation";
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
reportRouter.get("/:projectId/report/checks", async (req, res) =>
  res.json({ success: true, data: await service.getChecks(req.user!.id, id(req.params.projectId)) }),
);
