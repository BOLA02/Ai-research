import { prisma } from "../../lib/prisma";
import { AppError } from "../../shared/errors";
import { uniqueLabel } from "../../shared/labels";
import { getProject, requireProjectWriteAccess } from "../projects";

async function authorised(userId: string, projectId: string, id: string) {
  await requireProjectWriteAccess(userId, projectId);
  const row = await prisma.reportTable.findFirst({ where: { id, projectId } });
  if (!row) throw new AppError(404, "TABLE_NOT_FOUND", "Table not found");
  return row;
}

async function checkSection(projectId: string, sectionId?: string | null) {
  if (sectionId && !(await prisma.section.findFirst({ where: { id: sectionId, chapter: { projectId } }, select: { id: true } })))
    throw new AppError(400, "SECTION_NOT_FOUND", "That section is not in this project");
}

export async function list(userId: string, projectId: string) {
  await getProject(userId, projectId);
  return prisma.reportTable.findMany({ where: { projectId }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
}

export async function create(userId: string, projectId: string, input: { caption: string; label?: string; sectionId?: string | null; sourceNote: string | null; columns: string[]; rows: string[][] }) {
  await requireProjectWriteAccess(userId, projectId);
  await checkSection(projectId, input.sectionId);
  const taken = new Set((await prisma.reportTable.findMany({ where: { projectId }, select: { label: true } })).map((row) => row.label));
  if (input.label && taken.has(input.label)) throw new AppError(409, "LABEL_TAKEN", "That label is already used in this project");
  const sectionId = input.sectionId ?? null;
  return prisma.reportTable.create({
    data: {
      projectId,
      label: input.label ?? uniqueLabel(input.caption, taken),
      caption: input.caption,
      sectionId,
      sourceNote: input.sourceNote,
      columns: input.columns,
      rows: input.rows,
      position: await prisma.reportTable.count({ where: { projectId, sectionId } }),
    },
  });
}

export async function update(userId: string, projectId: string, id: string, input: { sectionId?: string | null; columns?: string[]; rows?: string[][] } & Record<string, unknown>) {
  const row = await authorised(userId, projectId, id);
  await checkSection(projectId, input.sectionId);
  // Changing only the columns (or only the rows) must still leave a rectangular grid.
  const columns = input.columns ?? (row.columns as string[]);
  const rows = input.rows ?? (row.rows as string[][]);
  if (!rows.every((cells) => cells.length === columns.length)) throw new AppError(400, "TABLE_SHAPE_INVALID", "Every row needs one cell for each column");
  return prisma.reportTable.update({ where: { id }, data: input as never });
}

export async function remove(userId: string, projectId: string, id: string) {
  await authorised(userId, projectId, id);
  await prisma.reportTable.delete({ where: { id } });
}
