import { prisma } from "../../lib/prisma";
import { evaluateCalculation, type Step, type Variable } from "../../calc/calculation";
import { AppError } from "../../shared/errors";
import { uniqueLabel } from "../../shared/labels";
import { getProject, requireProjectWriteAccess } from "../projects";

type Row = Awaited<ReturnType<typeof prisma.calculation.findFirstOrThrow>>;

/** A stored calculation with its working out, so the screen never has to do arithmetic. */
export function withResult(row: Row) {
  const variables = row.variables as Variable[];
  const steps = row.steps as Step[];
  return { ...row, variables, steps, result: evaluateCalculation({ variables, steps, note: row.note }) };
}

async function authorised(userId: string, projectId: string, id: string) {
  await requireProjectWriteAccess(userId, projectId);
  const row = await prisma.calculation.findFirst({ where: { id, projectId } });
  if (!row) throw new AppError(404, "CALCULATION_NOT_FOUND", "Calculation not found");
  return row;
}

async function checkSection(projectId: string, sectionId?: string | null) {
  if (sectionId && !(await prisma.section.findFirst({ where: { id: sectionId, chapter: { projectId } }, select: { id: true } })))
    throw new AppError(400, "SECTION_NOT_FOUND", "That section is not in this project");
}

export async function list(userId: string, projectId: string) {
  await getProject(userId, projectId);
  const rows = await prisma.calculation.findMany({ where: { projectId }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  return rows.map(withResult);
}

export async function create(userId: string, projectId: string, input: { title: string; label?: string; sectionId?: string | null; note: string | null; variables: Variable[]; steps: Step[] }) {
  await requireProjectWriteAccess(userId, projectId);
  await checkSection(projectId, input.sectionId);
  const taken = new Set((await prisma.calculation.findMany({ where: { projectId }, select: { label: true } })).map((row) => row.label));
  if (input.label && taken.has(input.label)) throw new AppError(409, "LABEL_TAKEN", "That label is already used in this project");
  const sectionId = input.sectionId ?? null;
  const row = await prisma.calculation.create({
    data: {
      projectId,
      label: input.label ?? uniqueLabel(input.title, taken),
      title: input.title,
      sectionId,
      note: input.note,
      variables: input.variables,
      steps: input.steps,
      position: await prisma.calculation.count({ where: { projectId, sectionId } }),
    },
  });
  return withResult(row);
}

export async function update(userId: string, projectId: string, id: string, input: { sectionId?: string | null } & Record<string, unknown>) {
  await authorised(userId, projectId, id);
  await checkSection(projectId, input.sectionId);
  return withResult(await prisma.calculation.update({ where: { id }, data: input as never }));
}

export async function remove(userId: string, projectId: string, id: string) {
  await authorised(userId, projectId, id);
  await prisma.calculation.delete({ where: { id } });
}

/** Works out a calculation without saving it, for live results while the student types. */
export async function preview(userId: string, projectId: string, input: { variables: Variable[]; steps: Step[]; note: string | null }) {
  await getProject(userId, projectId);
  return evaluateCalculation(input);
}
