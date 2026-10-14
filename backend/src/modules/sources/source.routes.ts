import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { create, list, remove, update } from "./source.controller";

export const sourceRouter = Router();
sourceRouter.use(requireAuth);
sourceRouter.get("/:projectId/sources", list);
sourceRouter.post("/:projectId/sources", create);
sourceRouter.patch("/:projectId/sources/:sourceId", update);
sourceRouter.delete("/:projectId/sources/:sourceId", remove);
