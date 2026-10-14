import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors";
import { parse, uuidSchema } from "../../shared/validation";
import { figureCreateSchema, figureUpdateSchema } from "./figure.validation";
import * as service from "./figure.service";

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const ids = (params: Record<string, string | string[]>) => ({
  projectId: parse(uuidSchema, one(params.projectId)),
  figureId: params.figureId ? parse(uuidSchema, one(params.figureId)) : "",
});

export const list: RequestHandler = async (req, res) =>
  res.json({ success: true, data: { figures: await service.list(req.user!.id, ids(req.params).projectId) } });

export const create: RequestHandler = async (req, res) =>
  res.status(201).json({ success: true, data: { figure: await service.create(req.user!.id, ids(req.params).projectId, parse(figureCreateSchema, req.body)) } });

export const update: RequestHandler = async (req, res) => {
  const x = ids(req.params);
  res.json({ success: true, data: { figure: await service.update(req.user!.id, x.projectId, x.figureId, parse(figureUpdateSchema, req.body)) } });
};

export const remove: RequestHandler = async (req, res) => {
  const x = ids(req.params);
  await service.remove(req.user!.id, x.projectId, x.figureId);
  res.status(204).send();
};

export const uploadImage: RequestHandler = async (req, res) => {
  const x = ids(req.params);
  if (!Buffer.isBuffer(req.body)) throw new AppError(415, "IMAGE_TYPE_UNSUPPORTED", "Send the image as the request body with an image content type");
  res.json({ success: true, data: { figure: await service.saveImage(req.user!.id, x.projectId, x.figureId, req.body) } });
};

export const deleteImage: RequestHandler = async (req, res) => {
  const x = ids(req.params);
  res.json({ success: true, data: { figure: await service.removeImage(req.user!.id, x.projectId, x.figureId) } });
};

export const getImage: RequestHandler = async (req, res) => {
  const x = ids(req.params);
  const { bytes, mimeType } = await service.image(req.user!.id, x.projectId, x.figureId);
  // The app and the API can sit on different origins, so allow the image to be embedded across sites.
  res.set({
    "Content-Type": mimeType,
    "Content-Length": String(bytes.length),
    "Cross-Origin-Resource-Policy": "cross-site",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, max-age=60",
  });
  res.send(bytes);
};
