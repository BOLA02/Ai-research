import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../shared/errors";
import { recordActivity } from "../activity";

const DAY = 86_400_000;
const since = (ms: number) => new Date(Date.now() - ms);

export async function overview() {
  const [users, signups24h, signups7d, projects, projects7d, sectionsWritten, exports7d, ai7d, failed24h, deactivated] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since(DAY) } } }),
    prisma.user.count({ where: { createdAt: { gte: since(7 * DAY) } } }),
    prisma.project.count(),
    prisma.project.count({ where: { createdAt: { gte: since(7 * DAY) } } }),
    prisma.section.count({ where: { NOT: { content: "" } } }),
    prisma.activityLog.count({ where: { type: "export_docx", createdAt: { gte: since(7 * DAY) } } }),
    prisma.activityLog.count({ where: { type: "ai_review", createdAt: { gte: since(7 * DAY) } } }),
    prisma.activityLog.count({ where: { type: "login_failed", createdAt: { gte: since(DAY) } } }),
    prisma.user.count({ where: { isActive: false } }),
  ]);
  const distinct = async (ms: number) => (await prisma.session.groupBy({ by: ["userId"], where: { lastUsedAt: { gte: since(ms) } } })).length;
  const [online, active24h, active7d] = await Promise.all([distinct(5 * 60_000), distinct(DAY), distinct(7 * DAY)]);

  const perDay = async (table: "User" | "ActivityLog") =>
    prisma.$queryRaw<{ day: Date; n: bigint }[]>(Prisma.sql`select date_trunc('day', "createdAt") as day, count(*) as n from ${Prisma.raw(`"${table}"`)} where "createdAt" >= now() - interval '14 days' group by 1 order by 1`);
  const [signupDays, activityDays, byType] = await Promise.all([
    perDay("User"),
    perDay("ActivityLog"),
    prisma.activityLog.groupBy({ by: ["type"], where: { createdAt: { gte: since(7 * DAY) } }, _count: { _all: true }, orderBy: { _count: { type: "desc" } } }),
  ]);
  const series = (rows: { day: Date; n: bigint }[]) => {
    const map = new Map(rows.map((row) => [row.day.toISOString().slice(0, 10), Number(row.n)]));
    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date(Date.now() - (13 - i) * DAY).toISOString().slice(0, 10);
      return { date, count: map.get(date) ?? 0 };
    });
  };
  return {
    users: { total: users, signups24h, signups7d, deactivated, online, active24h, active7d },
    projects: { total: projects, created7d: projects7d, sectionsWritten },
    last7d: { exports: exports7d, aiReviews: ai7d },
    failedLogins24h: failed24h,
    signupsByDay: series(signupDays),
    activityByDay: series(activityDays),
    eventsByType: byType.map((row) => ({ type: row.type, count: row._count._all })),
  };
}

export async function listUsers(input: { search?: string; page: number }) {
  const pageSize = 25;
  const search = input.search?.trim();
  const where: Prisma.UserWhereInput = search
    ? { OR: [{ email: { contains: search, mode: "insensitive" } }, { firstName: { contains: search, mode: "insensitive" } }, { lastName: { contains: search, mode: "insensitive" } }] }
    : {};
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (input.page - 1) * pageSize, take: pageSize, select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true, experienceLevel: true, createdAt: true, _count: { select: { projects: true } } } }),
  ]);
  const ids = rows.map((row) => row.id);
  const seen = ids.length ? await prisma.session.groupBy({ by: ["userId"], where: { userId: { in: ids } }, _max: { lastUsedAt: true } }) : [];
  const lastSeen = new Map(seen.map((row) => [row.userId, row._max.lastUsedAt]));
  return {
    total, page: input.page, pageSize,
    users: rows.map((row) => ({ id: row.id, name: `${row.firstName} ${row.lastName}`, email: row.email, role: row.role.toLowerCase(), isActive: row.isActive, level: row.experienceLevel, joined: row.createdAt.toISOString(), lastActive: lastSeen.get(row.id)?.toISOString() ?? null, projects: row._count.projects })),
  };
}

export async function setActive(adminId: string, userId: string, isActive: boolean) {
  if (adminId === userId) throw new AppError(400, "CANNOT_CHANGE_SELF", "You can't deactivate your own account");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");
  if (user.role === "ADMIN") throw new AppError(400, "CANNOT_CHANGE_ADMIN", "Administrators can't be deactivated here");
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  if (!isActive) await prisma.session.deleteMany({ where: { userId } });
  recordActivity({ type: isActive ? "account_activated" : "account_deactivated", userId, meta: { by: adminId } });
}

export async function listActivity(input: { type?: string; userId?: string; page: number }) {
  const pageSize = 50;
  const where: Prisma.ActivityLogWhereInput = { ...(input.type ? { type: input.type } : {}), ...(input.userId ? { userId: input.userId } : {}) };
  const [total, rows] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (input.page - 1) * pageSize, take: pageSize, include: { user: { select: { firstName: true, lastName: true, email: true } } } }),
  ]);
  return {
    total, page: input.page, pageSize,
    events: rows.map((row) => ({ id: row.id, type: row.type, at: row.createdAt.toISOString(), userId: row.userId, user: row.user ? { name: `${row.user.firstName} ${row.user.lastName}`, email: row.user.email } : null, projectId: row.projectId, meta: row.meta, ip: row.ip })),
  };
}

export async function listProjects(input: { page: number }) {
  const pageSize = 25;
  const [total, rows] = await Promise.all([
    prisma.project.count(),
    prisma.project.findMany({ orderBy: { updatedAt: "desc" }, skip: (input.page - 1) * pageSize, take: pageSize, select: { id: true, title: true, templateId: true, createdAt: true, updatedAt: true, owner: { select: { firstName: true, lastName: true, email: true } } } }),
  ]);
  const ids = rows.map((row) => row.id);
  // How much has been written, as numbers only. The text itself stays private to the student.
  const stats = ids.length
    ? await prisma.$queryRaw<{ projectId: string; started: bigint; words: bigint }[]>(Prisma.sql`
        select c."projectId" as "projectId", count(*) filter (where length(btrim(s.content)) > 0) as started,
               coalesce(sum(case when length(btrim(s.content)) > 0 then cardinality(regexp_split_to_array(btrim(s.content), '\\s+')) else 0 end), 0) as words
        from "Section" s join "Chapter" c on c.id = s."chapterId" where c."projectId" in (${Prisma.join(ids.map((id) => Prisma.sql`${id}::uuid`))}) group by c."projectId"`)
    : [];
  const byProject = new Map(stats.map((row) => [row.projectId, row]));
  return {
    total, page: input.page, pageSize,
    projects: rows.map((row) => ({ id: row.id, title: row.title, template: row.templateId, owner: { name: `${row.owner.firstName} ${row.owner.lastName}`, email: row.owner.email }, created: row.createdAt.toISOString(), updated: row.updatedAt.toISOString(), sectionsStarted: Number(byProject.get(row.id)?.started ?? 0), words: Number(byProject.get(row.id)?.words ?? 0) })),
  };
}
