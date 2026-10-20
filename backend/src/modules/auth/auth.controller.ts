import type { RequestHandler } from "express";
import { env } from "../../config/env";
import { parse } from "../../shared/validation";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema } from "./auth.validation";
import { requestPasswordReset, resetPassword } from "./password-reset";
import * as service from "./auth.service";
import { recordActivity } from "../activity";
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
const setSession = async (
  res: Parameters<RequestHandler>[1],
  user: { id: string },
) => {
  const session = await service.createSession(user.id);
  res.cookie(env.SESSION_COOKIE_NAME, session.token, {
    ...cookieOptions,
    expires: session.expiresAt,
  });
};
export const login: RequestHandler = async (req, res) => {
  const input = parse(loginSchema, req.body);
  let user;
  try {
    user = await service.login(input.email, input.password);
  } catch (error) {
    recordActivity({ type: "login_failed", meta: { email: input.email }, ip: req.ip });
    throw error;
  }
  await setSession(res, user);
  recordActivity({ type: "login", userId: user.id, ip: req.ip });
  res.json({ success: true, data: { user } });
};
export const signup: RequestHandler = async (req, res) => {
  let input: ReturnType<typeof signupSchema.parse>;
  try {
    input = parse(signupSchema, req.body);
  } catch (error) {
    const fields = (error as { details?: { fieldErrors?: Record<string, unknown> } }).details?.fieldErrors;
    recordActivity({ type: "signup_failed", meta: { fields: fields ? Object.keys(fields).join(",") : "unknown" }, ip: req.ip });
    throw error;
  }
  const user = await service.signup({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    password: input.password,
  });
  await setSession(res, user);
  recordActivity({ type: "signup", userId: user.id, ip: req.ip });
  res.status(201).json({ success: true, data: { user } });
};
export const logout: RequestHandler = async (req, res) => {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME];
  if (token) {
    const session = await service.getSession(token);
    await service.revokeSession(token);
    if (session) recordActivity({ type: "logout", userId: session.user.id });
  }
  res.clearCookie(env.SESSION_COOKIE_NAME, cookieOptions);
  res.json({ success: true, data: {} });
};
export const me: RequestHandler = (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};
export const forgotPassword: RequestHandler = async (req, res) => {
  const input = parse(forgotPasswordSchema, req.body);
  await requestPasswordReset(input.email);
  res.json({ success: true, data: {} });
};
export const resetPasswordHandler: RequestHandler = async (req, res) => {
  const input = parse(resetPasswordSchema, req.body);
  await resetPassword(input.token, input.password);
  res.clearCookie(env.SESSION_COOKIE_NAME, cookieOptions);
  res.json({ success: true, data: {} });
};
