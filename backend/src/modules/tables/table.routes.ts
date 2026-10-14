import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { create, list, remove, update } from "./table.controller";

export const tableRouter = Router();
tableRouter.use(requireAuth);
tableRouter.get("/:projectId/tables", list);
tableRouter.post("/:projectId/tables", create);
tableRouter.patch("/:projectId/tables/:tableId", update);
tableRouter.delete("/:projectId/tables/:tableId", remove);
