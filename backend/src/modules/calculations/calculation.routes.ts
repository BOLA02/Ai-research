import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { parse, uuidSchema } from "../../shared/validation";
import { calculationCreateSchema, calculationPreviewSchema, calculationUpdateSchema } from "./calculation.validation";
import * as service from "./calculation.service";

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const projectId = (params: Record<string, string | string[]>) => parse(uuidSchema, one(params.projectId));
const calculationId = (params: Record<string, string | string[]>) => parse(uuidSchema, one(params.calculationId));

export const calculationRouter = Router();
calculationRouter.use(requireAuth);

calculationRouter.get("/:projectId/calculations", async (req, res) => res.json({ success: true, data: { calculations: await service.list(req.user!.id, projectId(req.params)) } }));
calculationRouter.post("/:projectId/calculations", async (req, res) => res.status(201).json({ success: true, data: { calculation: await service.create(req.user!.id, projectId(req.params), parse(calculationCreateSchema, req.body)) } }));
calculationRouter.post("/:projectId/calculations/preview", async (req, res) => res.json({ success: true, data: { result: await service.preview(req.user!.id, projectId(req.params), parse(calculationPreviewSchema, req.body)) } }));
calculationRouter.patch("/:projectId/calculations/:calculationId", async (req, res) =>
  res.json({ success: true, data: { calculation: await service.update(req.user!.id, projectId(req.params), calculationId(req.params), parse(calculationUpdateSchema, req.body)) } }),
);
calculationRouter.delete("/:projectId/calculations/:calculationId", async (req, res) => {
  await service.remove(req.user!.id, projectId(req.params), calculationId(req.params));
  res.status(204).send();
});
