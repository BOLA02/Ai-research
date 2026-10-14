import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { env } from "./config/env";
import { authRouter } from "./modules/auth";
import { projectRouter } from "./modules/projects";
import { userRouter } from "./modules/users";
import { documentRouter } from "./modules/documents";
import { chapterRouter } from "./modules/chapters";
import { sectionRouter } from "./modules/sections";
import { templateRouter } from "./modules/templates";
import { sourceRouter } from "./modules/sources";
import { figureRouter } from "./modules/figures";
import { tableRouter } from "./modules/tables";
import { reportRouter } from "./modules/report";
import { exportRouter } from "./modules/export";
import { aiRouter } from "./modules/ai";
import { calculationRouter } from "./modules/calculations";
import { errorHandler, notFound } from "./middleware/errors";
export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.get("/api/health", (_req, res) =>
  res.json({ success: true, data: { status: "ok" } }),
);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/templates", templateRouter);
app.use("/api/projects", documentRouter);
app.use("/api/projects", sectionRouter);
app.use("/api/projects", chapterRouter);
app.use("/api/projects", sourceRouter);
app.use("/api/projects", figureRouter);
app.use("/api/projects", tableRouter);
app.use("/api/projects", calculationRouter);
app.use("/api/projects", reportRouter);
app.use("/api/projects", exportRouter);
app.use("/api", aiRouter);
app.use("/api/projects", projectRouter);
app.use(notFound);
app.use(errorHandler);
