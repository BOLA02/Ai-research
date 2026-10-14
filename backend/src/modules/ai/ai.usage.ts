import { prisma } from "../../lib/prisma";

/** Today's date at UTC midnight, the key for the daily limit. */
export const today = (now = new Date()) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

export async function usedToday(userId: string) {
  const row = await prisma.aiUsage.findUnique({ where: { userId_day: { userId, day: today() } } });
  return row?.count ?? 0;
}

/** Takes one review from today's allowance. Returns false, and takes nothing, when the allowance is used up. */
export async function reserve(userId: string, limit: number) {
  const day = today();
  const row = await prisma.aiUsage.upsert({
    where: { userId_day: { userId, day } },
    create: { userId, day, count: 1 },
    update: { count: { increment: 1 } },
  });
  if (row.count > limit) {
    await release(userId);
    return false;
  }
  return true;
}

/** Gives a review back, for example when the model could not be reached. */
export async function release(userId: string) {
  await prisma.aiUsage.updateMany({ where: { userId, day: today(), count: { gt: 0 } }, data: { count: { decrement: 1 } } });
}
