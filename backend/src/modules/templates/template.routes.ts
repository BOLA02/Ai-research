import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../shared/errors";
import { getTemplate, templates } from "../../templates";

export const templateRouter = Router();
templateRouter.use(requireAuth);
templateRouter.get("/", (_req, res) =>
  res.json({
    success: true,
    data: {
      templates: Object.values(templates).map(({ id, name, institution, department, programme, projectType }) => ({
        id, name, institution, department, programme, projectType,
      })),
    },
  }),
);
templateRouter.get("/:templateId", (req, res) => {
  const template = getTemplate(String(req.params.templateId));
  if (!template) throw new AppError(404, "TEMPLATE_NOT_FOUND", "Template not found");
  res.json({ success: true, data: { template } });
});
