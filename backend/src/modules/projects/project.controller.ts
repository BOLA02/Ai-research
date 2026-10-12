import type { RequestHandler } from "express";
import { parse, uuidSchema } from "../../shared/validation";
import { projectCreateSchema, projectUpdateSchema } from "./project.validation";
import * as service from "./project.service";
export const list: RequestHandler = async (req, res) =>
  res.json({
    success: true,
    data: { projects: await service.listProjects(req.user!.id) },
  });
export const create: RequestHandler = async (req, res) =>
  res
    .status(201)
    .json({
      success: true,
      data: {
        project: await service.createProject(
          req.user!.id,
          parse(projectCreateSchema, req.body),
        ),
      },
    });
export const getOne: RequestHandler = async (req, res) =>
  res.json({
    success: true,
    data: await service.getProject(
      req.user!.id,
      parse(uuidSchema, req.params.projectId),
    ),
  });
export const update: RequestHandler = async (req, res) =>
  res.json({
    success: true,
    data: {
      project: await service.updateProject(
        req.user!.id,
        parse(uuidSchema, req.params.projectId),
        parse(projectUpdateSchema, req.body),
      ),
    },
  });
export const remove: RequestHandler = async (req, res) => {
  await service.deleteProject(
    req.user!.id,
    parse(uuidSchema, req.params.projectId),
  );
  res.status(204).send();
};
