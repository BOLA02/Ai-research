import type { RequestHandler } from "express";
import { parse, uuidSchema } from "../../shared/validation";
import { sourceCreateSchema, sourceUpdateSchema } from "./source.validation";
import * as service from "./source.service";

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const ids = (params: Record<string, string | string[]>) => ({
  projectId: parse(uuidSchema, one(params.projectId)),
  sourceId: params.sourceId ? parse(uuidSchema, one(params.sourceId)) : "",
});

export const list: RequestHandler = async (req, res) =>
  res.json({ success: true, data: { sources: await service.list(req.user!.id, ids(req.params).projectId) } });

export const create: RequestHandler = async (req, res) =>
  res.status(201).json({ success: true, data: { source: await service.create(req.user!.id, ids(req.params).projectId, parse(sourceCreateSchema, req.body)) } });

export const update: RequestHandler = async (req, res) => {
  const x = ids(req.params);
  res.json({ success: true, data: { source: await service.update(req.user!.id, x.projectId, x.sourceId, parse(sourceUpdateSchema, req.body)) } });
};

export const remove: RequestHandler = async (req, res) => {
  const x = ids(req.params);
  await service.remove(req.user!.id, x.projectId, x.sourceId);
  res.status(204).send();
};
