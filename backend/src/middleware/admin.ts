import type { RequestHandler } from "express";
import { AppError } from "../shared/errors";
import { requireAuth } from "./auth";

/** Signed in and an administrator. */
export const requireAdmin: RequestHandler[] = [
  requireAuth,
  (req, _res, next) => {
    if (req.user?.role !== "admin") // Look like any other missing page, so the admin area is not announced to students.
    throw new AppError(404, "NOT_FOUND", "Not found");
    next();
  },
];
