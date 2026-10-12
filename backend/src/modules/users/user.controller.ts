import type { RequestHandler } from "express";
import { parse } from "../../shared/validation";
import { profileUpdateSchema } from "./user.validation";
import * as service from "./user.service";
export const getCurrentProfile: RequestHandler = async (req, res) =>
  res.json({
    success: true,
    data: { user: await service.getUser(req.user!.id) },
  });
export const patchCurrentProfile: RequestHandler = async (req, res) =>
  res.json({
    success: true,
    data: {
      user: await service.updateProfile(
        req.user!.id,
        parse(profileUpdateSchema, req.body),
      ),
    },
  });
