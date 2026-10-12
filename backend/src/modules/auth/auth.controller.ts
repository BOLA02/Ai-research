import type { RequestHandler } from "express";
import { env } from "../../config/env";
import { parse } from "../../shared/validation";
import { loginSchema, signupSchema } from "./auth.validation";
import * as service from "./auth.service";
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
  const input = parse(loginSchema, req.body),
    user = await service.login(input.email, input.password);
  await setSession(res, user);
  res.json({ success: true, data: { user } });
};
export const signup: RequestHandler = async (req, res) => {
  const input = parse(signupSchema, req.body),
    user = await service.signup({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: input.password,
    });
  await setSession(res, user);
  res.status(201).json({ success: true, data: { user } });
};
export const logout: RequestHandler = async (req, res) => {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME];
  if (token) await service.revokeSession(token);
  res.clearCookie(env.SESSION_COOKIE_NAME, cookieOptions);
  res.json({ success: true, data: {} });
};
export const me: RequestHandler = (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};
