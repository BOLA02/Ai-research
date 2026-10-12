import { ProjectMemberRole } from "@prisma/client";
import { prisma } from "../../lib/prisma";
const accessWhere = (userId: string) => ({
  OR: [{ ownerId: userId }, { members: { some: { userId } } }],
});
export function listAccessible(userId: string) {
  return prisma.project.findMany({
    where: accessWhere(userId),
    orderBy: { updatedAt: "desc" },
  });
}
export function findAccessible(userId: string, projectId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, ...accessWhere(userId) },
    include: { members: { where: { userId }, select: { role: true } } },
  });
}
export function createOwned(
  userId: string,
  data: {
    title: string;
    institution?: string;
    department?: string;
    programme?: string;
    projectType?: string;
    referenceStyle?: string;
  },
) {
  return prisma.$transaction(async (tx) => {
    const documents = [
      ["COVER_PAGE", "Cover Page"], ["TITLE_PAGE", "Title Page"],
      ["CERTIFICATION", "Certification"], ["DECLARATION", "Declaration"],
      ["DEDICATION", "Dedication"], ["ACKNOWLEDGEMENT", "Acknowledgement"],
      ["ABSTRACT", "Abstract"], ["TABLE_OF_CONTENTS", "Table of Contents"],
      ["LIST_OF_FIGURES", "List of Figures"], ["LIST_OF_TABLES", "List of Tables"],
    ] as const;
    const chapters = ["Introduction", "Literature Review", "Methodology", "Results and Discussion", "Conclusion and Recommendations"];
    const project = await tx.project.create({ data: {
      ...data, ownerId: userId,
      documents: { create: documents.map(([type, title], position) => ({ type, title, position })) },
      chapters: { create: chapters.map((title, position) => ({ number: position + 1, title, position })) },
    }});
    await tx.projectMember.create({
      data: { projectId: project.id, userId, role: ProjectMemberRole.OWNER },
    });
    return project;
  });
}
export function updateById(
  projectId: string,
  data: Partial<{
    title: string;
    institution: string;
    department: string;
    programme: string;
    projectType: string;
    referenceStyle: string;
  }>,
) {
  return prisma.project.update({ where: { id: projectId }, data });
}
export function deleteOwned(projectId: string, ownerId: string) {
  return prisma.project.deleteMany({ where: { id: projectId, ownerId } });
}
