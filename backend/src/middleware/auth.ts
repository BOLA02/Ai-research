import type { RequestHandler } from "express";
import { env } from "../config/env";
import { getSession } from "../modules/auth";
import { AppError } from "../shared/errors";
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME];
  if (!token)
    throw new AppError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication required",
    );
  const session = await getSession(token);
  if (!session)
    throw new AppError(401, "INVALID_SESSION", "Session is invalid or expired");
  req.user = session.user;
  req.sessionId = session.sessionId;
  next();
};
