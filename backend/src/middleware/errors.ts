import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../shared/errors";
import { env } from "../config/env";
export const notFound: RequestHandler = (req, _res, next) =>
  next(
    new AppError(
      404,
      "ROUTE_NOT_FOUND",
      `Route ${req.method} ${req.path} was not found`,
    ),
  );
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError)
    return res
      .status(error.status)
      .json({
        success: false,
        message: error.message,
        code: error.code,
        ...(error.details ? { details: error.details } : {}),
      });
  if (error instanceof ZodError)
    return res
      .status(400)
      .json({
        success: false,
        message: "Request validation failed",
        code: "VALIDATION_ERROR",
        details: error.flatten(),
      });
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
    return res
      .status(409)
      .json({
        success: false,
        message: "A record with this value already exists",
        code: "UNIQUE_CONSTRAINT_VIOLATION",
      });
  console.error(error);
  return res
    .status(500)
    .json({
      success: false,
      message: "An unexpected error occurred",
      code: "INTERNAL_SERVER_ERROR",
      ...(env.NODE_ENV === "development" ? { details: String(error) } : {}),
    });
};
