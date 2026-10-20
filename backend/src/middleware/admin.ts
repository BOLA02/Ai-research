import type { RequestHandler } from "express";
import { AppError } from "../shared/errors";
import { requireAuth } from "./auth";

/** Signed in and an administrator. */
export const requireAdmin: RequestHandler[] = [
  requireAuth,
  (req, _res, next) => {
    if (req.user?.role !== "admin") throw new AppError(403, "ADMIN_ONLY", "This area is for administrators");
    next();
  },
];
