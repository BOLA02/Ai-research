import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors";
import { createUser, findUserByEmail, publicUser } from "../users";
import * as repository from "./auth.repository";
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (
    !user ||
    !user.isActive ||
    !(await bcrypt.compare(password, user.passwordHash))
  )
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  return publicUser(user);
}
export async function signup(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  if (await findUserByEmail(input.email))
    throw new AppError(
      409,
      "EMAIL_ALREADY_EXISTS",
      "An account with this email already exists",
    );
  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    return publicUser(
      await createUser({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash,
        role: UserRole.STUDENT,
      }),
    );
  } catch (error) {
    if ((error as { code?: string }).code === "P2002")
      throw new AppError(
        409,
        "EMAIL_ALREADY_EXISTS",
        "An account with this email already exists",
      );
    throw error;
  }
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url"),
    expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 3600000);
  await repository.createSessionRecord(userId, hashToken(token), expiresAt);
  return { token, expiresAt };
}
export async function getSession(rawToken: string) {
  const session = await repository.findSession(hashToken(rawToken));
  if (!session) return null;
  await repository.touchSession(session.id);
  return { user: publicUser(session.user), sessionId: session.id };
}
export async function revokeSession(rawToken: string) {
  await repository.deleteSession(hashToken(rawToken));
}
