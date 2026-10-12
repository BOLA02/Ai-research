import { prisma } from "../../lib/prisma";
export function createSessionRecord(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
) {
  return prisma.session.create({ data: { userId, tokenHash, expiresAt } });
}
export function findSession(tokenHash: string) {
  return prisma.session.findFirst({
    where: {
      tokenHash,
      expiresAt: { gt: new Date() },
      user: { isActive: true },
    },
    include: { user: true },
  });
}
export function touchSession(id: string) {
  return prisma.session.update({
    where: { id },
    data: { lastUsedAt: new Date() },
  });
}
export function deleteSession(tokenHash: string) {
  return prisma.session.deleteMany({ where: { tokenHash } });
}
