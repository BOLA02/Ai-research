import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { getCurrentProfile, patchCurrentProfile } from "./user.controller";
export const userRouter = Router();
userRouter.get("/me", requireAuth, getCurrentProfile);
userRouter.patch("/me", requireAuth, patchCurrentProfile);
