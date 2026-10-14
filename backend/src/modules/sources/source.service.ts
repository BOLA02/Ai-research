import { AppError } from "../../shared/errors";
import { getProject, requireProjectWriteAccess } from "../projects";
import * as repository from "./source.repository";

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");

async function uniqueKey(projectId: string, wanted: string) {
  const base = slug(wanted).slice(0, 50) || "source";
  const taken = new Set((await repository.keysStartingWith(projectId, base)).map((row) => row.citeKey));
  if (!taken.has(base)) return base;
  for (const letter of "abcdefghijklmnopqrstuvwxyz") if (!taken.has(`${base}${letter}`)) return `${base}${letter}`;
  return `${base}${Date.now()}`;
}

const keyFrom = (input: { authors?: { family: string }[]; title: string; year?: number | null }) =>
  `${input.authors?.[0]?.family ?? input.title.split(/\s+/)[0] ?? ""}${input.year ?? ""}`;

async function authorised(userId: string, projectId: string, id: string) {
  await requireProjectWriteAccess(userId, projectId);
  const row = await repository.find(projectId, id);
  if (!row) throw new AppError(404, "SOURCE_NOT_FOUND", "Source not found");
  return row;
}

export async function list(userId: string, projectId: string) {
  await getProject(userId, projectId);
  return repository.list(projectId);
}

export async function create(userId: string, projectId: string, input: { citeKey?: string } & Parameters<typeof keyFrom>[0] & Record<string, unknown>) {
  await requireProjectWriteAccess(userId, projectId);
  const { citeKey, ...data } = input;
  const key = citeKey ? citeKey : await uniqueKey(projectId, keyFrom(input));
  if (citeKey) {
    const clash = (await repository.keysStartingWith(projectId, citeKey)).some((row) => row.citeKey === citeKey);
    if (clash) throw new AppError(409, "SOURCE_KEY_TAKEN", "That citation key is already used in this project");
  }
  return repository.create(projectId, key, data as Parameters<typeof repository.create>[2]);
}

export async function update(userId: string, projectId: string, id: string, input: Parameters<typeof repository.update>[1]) {
  await authorised(userId, projectId, id);
  return repository.update(id, input);
}

export async function remove(userId: string, projectId: string, id: string) {
  await authorised(userId, projectId, id);
  await repository.remove(id);
}
