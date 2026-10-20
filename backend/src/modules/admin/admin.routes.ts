import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../../middleware/admin";
import { parse, uuidSchema } from "../../shared/validation";
import * as service from "./admin.service";

export const adminRouter = Router();
adminRouter.use(requireAdmin);

const page = z.coerce.number().int().min(1).max(10_000).default(1);
const one = (value: unknown) => (Array.isArray(value) ? value[0] : value);

adminRouter.get("/overview", async (_req, res) => res.json({ success: true, data: await service.overview() }));

adminRouter.get("/insights", async (_req, res) => res.json({ success: true, data: await service.insights() }));

adminRouter.get("/users", async (req, res) => {
  const query = parse(z.object({ search: z.string().max(100).optional(), page }), { search: one(req.query.search), page: one(req.query.page) });
  res.json({ success: true, data: await service.listUsers(query) });
});

adminRouter.patch("/users/:userId", async (req, res) => {
  const userId = parse(uuidSchema, one(req.params.userId));
  const body = parse(z.object({ isActive: z.boolean() }).strict(), req.body);
  await service.setActive(req.user!.id, userId, body.isActive);
  res.json({ success: true, data: {} });
});

adminRouter.get("/activity", async (req, res) => {
  const query = parse(z.object({ type: z.string().max(40).optional(), userId: z.string().uuid().optional(), page }), { type: one(req.query.type) || undefined, userId: one(req.query.userId) || undefined, page: one(req.query.page) });
  res.json({ success: true, data: await service.listActivity(query) });
});

adminRouter.get("/projects", async (req, res) => {
  const query = parse(z.object({ page }), { page: one(req.query.page) });
  res.json({ success: true, data: await service.listProjects(query) });
});
