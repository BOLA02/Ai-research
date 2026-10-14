import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { sendMail, type Mailer } from "../../lib/mailer";
import { AppError } from "../../shared/errors";
import { findUserByEmail } from "../users";
import { resetEmail } from "./reset-email";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Starts a reset. The caller always answers the same way, whether or not the
 * email belongs to an account, so this cannot be used to find out who has one.
 */
export async function requestPasswordReset(email: string, mailer: Mailer = sendMail) {
  const user = await findUserByEmail(email);
  if (!user || !user.isActive) return;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60_000);
  // Only the newest link works.
  await prisma.$transaction([
    prisma.passwordReset.deleteMany({ where: { userId: user.id } }),
    prisma.passwordReset.create({ data: { userId: user.id, tokenHash: hash(token), expiresAt } }),
  ]);
  const link = `${env.FRONTEND_URL.replace(/\/$/, "")}/reset-password?token=${token}`;
  try {
    await mailer({ to: user.email, subject: "Reset your ProjectForge password", ...resetEmail(user.firstName, link, env.PASSWORD_RESET_TTL_MINUTES) });
  } catch (error) {
    // Do not tell the caller: a different answer would reveal that the account exists.
    console.error("Could not send the password reset email", error instanceof Error ? error.message : error);
  }
}

export async function resetPassword(token: string, password: string) {
  const record = await prisma.passwordReset.findUnique({ where: { tokenHash: hash(token) }, include: { user: true } });
  if (!record || record.usedAt || record.expiresAt <= new Date() || !record.user.isActive)
    throw new AppError(400, "RESET_LINK_INVALID", "This reset link has expired or was already used. Ask for a new one.");
  const passwordHash = await bcrypt.hash(password, 12);
  // Claim the link first so two requests cannot both use it.
  const claimed = await prisma.passwordReset.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: new Date() } });
  if (claimed.count !== 1) throw new AppError(400, "RESET_LINK_INVALID", "This reset link has expired or was already used. Ask for a new one.");
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    // Anyone signed in with the old password is signed out.
    prisma.session.deleteMany({ where: { userId: record.userId } }),
    prisma.passwordReset.deleteMany({ where: { userId: record.userId } }),
  ]);
}
