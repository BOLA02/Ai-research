import type { RequestHandler } from "express";
import { parse, uuidSchema } from "../../shared/validation";
import { tableCreateSchema, tableUpdateSchema } from "./table.validation";
import * as service from "./table.service";

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const ids = (params: Record<string, string | string[]>) => ({
  projectId: parse(uuidSchema, one(params.projectId)),
  tableId: params.tableId ? parse(uuidSchema, one(params.tableId)) : "",
});

export const list: RequestHandler = async (req, res) =>
  res.json({ success: true, data: { tables: await service.list(req.user!.id, ids(req.params).projectId) } });

export const create: RequestHandler = async (req, res) =>
  res.status(201).json({ success: true, data: { table: await service.create(req.user!.id, ids(req.params).projectId, parse(tableCreateSchema, req.body)) } });

export const update: RequestHandler = async (req, res) => {
  const x = ids(req.params);
  res.json({ success: true, data: { table: await service.update(req.user!.id, x.projectId, x.tableId, parse(tableUpdateSchema, req.body)) } });
};

export const remove: RequestHandler = async (req, res) => {
  const x = ids(req.params);
  await service.remove(req.user!.id, x.projectId, x.tableId);
  res.status(204).send();
};
