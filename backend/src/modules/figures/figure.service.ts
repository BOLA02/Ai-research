import { AppError } from "../../shared/errors";
import { uniqueLabel } from "../../shared/labels";
import { getProject, requireProjectWriteAccess } from "../projects";
import * as repository from "./figure.repository";

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/** Checks the first bytes so a file cannot claim to be an image it is not. */
export function detectImageType(bytes: Buffer): "image/png" | "image/jpeg" | null {
  if (bytes.length > 12 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  return null;
}

async function authorised(userId: string, projectId: string, id: string) {
  await requireProjectWriteAccess(userId, projectId);
  const row = await repository.find(projectId, id);
  if (!row) throw new AppError(404, "FIGURE_NOT_FOUND", "Figure not found");
  return row;
}

async function checkSection(projectId: string, sectionId?: string | null) {
  if (sectionId && !(await repository.sectionInProject(projectId, sectionId))) throw new AppError(400, "SECTION_NOT_FOUND", "That section is not in this project");
}

export async function list(userId: string, projectId: string) {
  await getProject(userId, projectId);
  return (await repository.list(projectId)).map(repository.withImageFlag);
}

export async function create(userId: string, projectId: string, input: { caption: string; label?: string; sectionId?: string | null; sourceNote: string | null; isOriginal: boolean; altText: string | null }) {
  await requireProjectWriteAccess(userId, projectId);
  await checkSection(projectId, input.sectionId);
  const taken = new Set((await repository.labels(projectId)).map((row) => row.label));
  if (input.label && taken.has(input.label)) throw new AppError(409, "LABEL_TAKEN", "That label is already used in this project");
  const sectionId = input.sectionId ?? null;
  const row = await repository.create({
    projectId,
    label: input.label ?? uniqueLabel(input.caption, taken),
    caption: input.caption,
    sectionId,
    sourceNote: input.sourceNote,
    isOriginal: input.isOriginal,
    altText: input.altText,
    position: await repository.countInSection(projectId, sectionId),
  });
  return repository.withImageFlag(row);
}

export async function update(userId: string, projectId: string, id: string, input: { sectionId?: string | null } & Record<string, unknown>) {
  await authorised(userId, projectId, id);
  await checkSection(projectId, input.sectionId);
  return repository.withImageFlag(await repository.update(id, input));
}

export async function saveImage(userId: string, projectId: string, id: string, bytes: Buffer) {
  await authorised(userId, projectId, id);
  if (bytes.length === 0) throw new AppError(400, "IMAGE_REQUIRED", "Send an image file");
  if (bytes.length > MAX_IMAGE_BYTES) throw new AppError(413, "IMAGE_TOO_LARGE", "Images can be up to 3 MB");
  const type = detectImageType(bytes);
  if (!type) throw new AppError(415, "IMAGE_TYPE_UNSUPPORTED", "Use a PNG or JPEG image");
  return repository.withImageFlag(await repository.setImage(id, bytes, type));
}

export async function removeImage(userId: string, projectId: string, id: string) {
  await authorised(userId, projectId, id);
  return repository.withImageFlag(await repository.clearImage(id));
}

export async function image(userId: string, projectId: string, id: string) {
  await getProject(userId, projectId);
  const row = await repository.findWithImage(projectId, id);
  if (!row?.imageData || !row.mimeType) throw new AppError(404, "IMAGE_NOT_FOUND", "This figure has no image yet");
  return { bytes: Buffer.from(row.imageData), mimeType: row.mimeType };
}

export async function remove(userId: string, projectId: string, id: string) {
  await authorised(userId, projectId, id);
  await repository.remove(id);
}
