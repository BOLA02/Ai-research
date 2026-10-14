import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

type Input = Omit<Prisma.SourceUncheckedCreateInput, "projectId" | "citeKey">;

export const list = (projectId: string) => prisma.source.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } });
export const find = (projectId: string, id: string) => prisma.source.findFirst({ where: { id, projectId } });
export const keysStartingWith = (projectId: string, prefix: string) =>
  prisma.source.findMany({ where: { projectId, citeKey: { startsWith: prefix } }, select: { citeKey: true } });
export const create = (projectId: string, citeKey: string, data: Input) => prisma.source.create({ data: { ...data, projectId, citeKey } });
export const update = (id: string, data: Prisma.SourceUncheckedUpdateInput) => prisma.source.update({ where: { id }, data });
export const remove = (id: string) => prisma.source.delete({ where: { id } });
