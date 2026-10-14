import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { parse, uuidSchema } from "../../shared/validation";
import { exportDocx, previewModel } from "./export.service";

export const exportRouter = Router();
exportRouter.use(requireAuth);

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

exportRouter.get("/:projectId/export/docx", async (req, res) => {
  const projectId = parse(uuidSchema, Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId);
  const { buffer, title } = await exportDocx(req.user!.id, projectId);
  const safe = title.replace(/[^A-Za-z0-9 _-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80) || "project-report";
  res.set({
    "Content-Type": DOCX,
    "Content-Length": String(buffer.length),
    "Content-Disposition": `attachment; filename="${safe}.docx"`,
    "Cache-Control": "no-store",
  });
  res.send(buffer);
});

exportRouter.get("/:projectId/export/preview", async (req, res) => {
  const projectId = parse(uuidSchema, Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId);
  res.set("Cache-Control", "no-store");
  res.json({ success: true, data: { model: await previewModel(req.user!.id, projectId) } });
});
