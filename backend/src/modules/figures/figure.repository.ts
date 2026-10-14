import { prisma } from "../../lib/prisma";

// The image bytes are large, so they are never part of a list.
const listSelect = {
  id: true, projectId: true, sectionId: true, label: true, caption: true, sourceNote: true,
  isOriginal: true, altText: true, mimeType: true, position: true, createdAt: true, updatedAt: true,
} as const;

type Row = { mimeType: string | null };
export const withImageFlag = <T extends Row>(row: T) => ({ ...row, hasImage: row.mimeType !== null });

export const list = (projectId: string) => prisma.figure.findMany({ where: { projectId }, select: listSelect, orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
export const find = (projectId: string, id: string) => prisma.figure.findFirst({ where: { id, projectId }, select: listSelect });
export const findWithImage = (projectId: string, id: string) => prisma.figure.findFirst({ where: { id, projectId }, select: { imageData: true, imageUrl: true, imagePublicId: true, mimeType: true } });
export const labels = (projectId: string) => prisma.figure.findMany({ where: { projectId }, select: { label: true } });
export const countInSection = (projectId: string, sectionId: string | null) => prisma.figure.count({ where: { projectId, sectionId } });
export const sectionInProject = (projectId: string, sectionId: string) => prisma.section.findFirst({ where: { id: sectionId, chapter: { projectId } }, select: { id: true } });
export const create = (data: { projectId: string; label: string; caption: string; sectionId: string | null; sourceNote: string | null; isOriginal: boolean; altText: string | null; position: number }) =>
  prisma.figure.create({ data, select: listSelect });
export const update = (id: string, data: Record<string, unknown>) => prisma.figure.update({ where: { id }, data, select: listSelect });
export const setImage = (id: string, image: { imageData: Buffer | null; imageUrl: string | null; imagePublicId: string | null; mimeType: string }) => prisma.figure.update({ where: { id }, data: image, select: listSelect });
export const clearImage = (id: string) => prisma.figure.update({ where: { id }, data: { imageData: null, imageUrl: null, imagePublicId: null, mimeType: null }, select: listSelect });
export const remove = (id: string) => prisma.figure.delete({ where: { id } });
