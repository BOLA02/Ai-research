import { Prisma } from "@prisma/client";
import { env } from "../../config/env";
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
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, email: true } });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");
  const listed = env.ADMIN_EMAILS.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean).includes(user.email.toLowerCase());
  if (user.role === "ADMIN" || listed) throw new AppError(400, "CANNOT_CHANGE_ADMIN", "Administrators can't be deactivated here");
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

/* ---------------------------------------------------------------- insights */

const num = (value: unknown) => Number(value ?? 0);

/**
 * Where students get stuck. Everything here is counted, never read: how many have started
 * each section, which checks fail most, which guide steps people leave at. No student text.
 */
export async function insights() {
  const owners = async (join: string, extra = "") =>
    num((await prisma.$queryRawUnsafe<{ n: bigint }[]>(`select count(distinct p."ownerId") as n from "Project" p ${join} ${extra}`))[0]?.n);
  const distinctUsers = async (type: string) =>
    num((await prisma.$queryRaw<{ n: bigint }[]>(Prisma.sql`select count(distinct "userId") as n from "ActivityLog" where type = ${type} and "userId" is not null`))[0]?.n);

  const [signedUp, onboarded, withProject, wroteSection, addedSource, addedFigure, addedCalc, ranChecks, exported] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { onboardedAt: { not: null } } }),
    owners(""),
    owners(`join "Chapter" c on c."projectId" = p.id join "Section" s on s."chapterId" = c.id`, `where length(btrim(s.content)) > 0`),
    owners(`join "Source" x on x."projectId" = p.id`),
    owners(`join "Figure" x on x."projectId" = p.id`, `where x."mimeType" is not null`),
    owners(`join "Calculation" x on x."projectId" = p.id`),
    distinctUsers("checks_run"),
    distinctUsers("export_docx"),
  ]);
  const funnel = [
    { step: "Signed up", users: signedUp },
    { step: "Answered the readiness questions", users: onboarded },
    { step: "Created a project", users: withProject },
    { step: "Wrote in at least one section", users: wroteSection },
    { step: "Added a reference", users: addedSource },
    { step: "Added a figure with a picture", users: addedFigure },
    { step: "Added a calculation", users: addedCalc },
    { step: "Ran the checks", users: ranChecks },
    { step: "Downloaded the Word report", users: exported },
  ];

  const sectionRows = await prisma.$queryRaw<{ key: string; title: string; chapter: number; projects: bigint; started: bigint; words: bigint }[]>(Prisma.sql`
    select s."templateKey" as key, min(s.title) as title, min(c.number) as chapter, count(*) as projects,
           count(*) filter (where length(btrim(s.content)) > 0) as started,
           coalesce(round(avg(cardinality(regexp_split_to_array(btrim(s.content), '\\s+'))) filter (where length(btrim(s.content)) > 0)), 0) as words
    from "Section" s join "Chapter" c on c.id = s."chapterId"
    where s."templateKey" is not null group by s."templateKey" order by min(c.number), min(s."position")`);
  const sections = sectionRows.map((row) => ({ key: row.key, title: row.title, chapter: num(row.chapter), projects: num(row.projects), started: num(row.started), startedPct: num(row.projects) ? Math.round((num(row.started) / num(row.projects)) * 100) : 0, avgWords: num(row.words) }));

  const failing = await prisma.$queryRaw<{ id: string; n: bigint }[]>(Prisma.sql`
    select unnest(string_to_array(meta->>'open', ',')) as id, count(*) as n from "ActivityLog"
    where type = 'checks_run' and "createdAt" >= now() - interval '30 days' and coalesce(meta->>'open', '') <> '' group by 1 order by 2 desc limit 12`);
  const runs = await prisma.$queryRaw<{ n: bigint; u: bigint }[]>(Prisma.sql`select count(*) as n, count(distinct "userId") as u from "ActivityLog" where type = 'checks_run' and "createdAt" >= now() - interval '30 days'`);

  const guideRows = await prisma.$queryRaw<{ guide: string; opened: bigint; closed: bigint; completed: bigint }[]>(Prisma.sql`
    select meta->>'guide' as guide, count(*) filter (where type = 'guide_opened') as opened, count(*) filter (where type = 'guide_closed') as closed,
           count(*) filter (where type = 'guide_closed' and meta->>'completed' = 'true') as completed
    from "ActivityLog" where type in ('guide_opened', 'guide_closed') and "createdAt" >= now() - interval '30 days' group by 1 order by 2 desc`);
  const leftAt = await prisma.$queryRaw<{ guide: string; step: number; n: bigint }[]>(Prisma.sql`
    select meta->>'guide' as guide, (meta->>'step')::int as step, count(*) as n from "ActivityLog"
    where type = 'guide_closed' and meta->>'completed' = 'false' and "createdAt" >= now() - interval '30 days' group by 1, 2 order by 3 desc`);
  const guides = guideRows.map((row) => {
    const worst = leftAt.find((item) => item.guide === row.guide);
    return { guide: row.guide, opened: num(row.opened), closed: num(row.closed), completed: num(row.completed), skipped: Math.max(0, num(row.closed) - num(row.completed)), mostLeftAtStep: worst ? worst.step + 1 : null, leftAtCount: worst ? num(worst.n) : 0 };
  });

  const tools = await prisma.$queryRaw<{ tool: string; opens: bigint; users: bigint }[]>(Prisma.sql`
    select meta->>'tool' as tool, count(*) as opens, count(distinct "userId") as users from "ActivityLog" where type = 'tool_opened' and "createdAt" >= now() - interval '30 days' group by 1 order by 2 desc`);
  const errors = await prisma.$queryRaw<{ code: string; n: bigint; users: bigint }[]>(Prisma.sql`
    select meta->>'code' as code, count(*) as n, count(distinct "userId") as users from "ActivityLog" where type = 'client_error' and "createdAt" >= now() - interval '30 days' group by 1 order by 2 desc limit 10`);
  const signupFields = await prisma.$queryRaw<{ field: string; n: bigint }[]>(Prisma.sql`
    select unnest(string_to_array(meta->>'fields', ',')) as field, count(*) as n from "ActivityLog" where type = 'signup_failed' and "createdAt" >= now() - interval '30 days' group by 1 order by 2 desc`);
  const stalled = await prisma.user.count({
    where: { createdAt: { lt: since(3 * DAY) }, role: "STUDENT", projects: { none: { chapters: { some: { sections: { some: { NOT: { content: "" } } } } } } } },
  });

  // Plain-language pointers, built from the numbers above.
  const notes: string[] = [];
  const first = funnel[0].users;
  for (let i = 1; i < funnel.length && first >= 5; i += 1) {
    const drop = funnel[i - 1].users ? 1 - funnel[i].users / funnel[i - 1].users : 0;
    if (drop >= 0.4 && funnel[i - 1].users >= 5) notes.push(`${Math.round(drop * 100)}% of students who reached "${funnel[i - 1].step}" never got to "${funnel[i].step}".`);
  }
  const weak = sections.filter((s) => s.projects >= 5).sort((a, b) => a.startedPct - b.startedPct)[0];
  if (weak && weak.startedPct < 60) notes.push(`"${weak.title}" is the section fewest students start (${weak.startedPct}%). Its guide may need to be clearer.`);
  const badGuide = guides.filter((g) => g.closed >= 5).sort((a, b) => b.skipped / b.closed - a.skipped / a.closed)[0];
  if (badGuide && badGuide.skipped / badGuide.closed >= 0.5 && badGuide.mostLeftAtStep) notes.push(`${Math.round((badGuide.skipped / badGuide.closed) * 100)}% skip the "${badGuide.guide}" guide, most often at step ${badGuide.mostLeftAtStep}.`);
  if (failing[0] && num(runs[0]?.u) >= 3) notes.push(`The check that fails most often is "${failing[0].id}", seen in ${num(failing[0].n)} of ${num(runs[0]?.n)} runs.`);
  if (stalled >= 3) notes.push(`${stalled} students signed up more than 3 days ago and have not written anything yet.`);

  return {
    funnel, sections, notes, stalledStudents: stalled,
    checks: { runs: num(runs[0]?.n), students: num(runs[0]?.u), mostOften: failing.map((row) => ({ id: row.id, count: num(row.n) })) },
    guides,
    tools: tools.map((row) => ({ tool: row.tool, opens: num(row.opens), students: num(row.users) })),
    errors: errors.map((row) => ({ code: row.code, count: num(row.n), students: num(row.users) })),
    signupProblems: signupFields.map((row) => ({ field: row.field, count: num(row.n) })),
  };
}
