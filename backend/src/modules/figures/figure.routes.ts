import express, { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { MAX_IMAGE_BYTES } from "./figure.service";
import { create, deleteImage, getImage, list, remove, update, uploadImage } from "./figure.controller";

export const figureRouter = Router();
figureRouter.use(requireAuth);
figureRouter.get("/:projectId/figures", list);
figureRouter.post("/:projectId/figures", create);
figureRouter.patch("/:projectId/figures/:figureId", update);
figureRouter.delete("/:projectId/figures/:figureId", remove);
figureRouter.get("/:projectId/figures/:figureId/image", getImage);
figureRouter.put("/:projectId/figures/:figureId/image", express.raw({ type: ["image/png", "image/jpeg", "image/webp"], limit: MAX_IMAGE_BYTES }), uploadImage);
figureRouter.delete("/:projectId/figures/:figureId/image", deleteImage);
