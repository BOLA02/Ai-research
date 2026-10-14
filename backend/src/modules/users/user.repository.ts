import { prisma } from "../../lib/prisma";
import type { UserRole } from "@prisma/client";
export const userPublicSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  isActive: true,
  experienceLevel: true,
  onboardedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;
export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}
export function findActiveUserById(id: string) {
  return prisma.user.findFirst({
    where: { id, isActive: true },
    select: userPublicSelect,
  });
}
export function createUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}) {
  return prisma.user.create({ data, select: userPublicSelect });
}
export function updateUser(
  id: string,
  data: { firstName?: string; lastName?: string },
) {
  return prisma.user.update({ where: { id }, data, select: userPublicSelect });
}
export function setOnboarding(
  id: string,
  data: { experienceLevel: string | null; onboardedAt: Date },
) {
  return prisma.user.update({ where: { id }, data, select: userPublicSelect });
}
