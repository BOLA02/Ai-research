import { Prisma, ProjectMemberRole } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../shared/errors";
import { fillPlaceholders, getTemplate, resolveTemplateId, type SectionTemplate } from "../../templates";
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
type CreateInput = {
  title: string;
  institution?: string;
  department?: string;
  programme?: string;
  projectType?: string;
  referenceStyle?: string;
  templateId?: string;
  studentName?: string | null;
  registrationNumber?: string | null;
  supervisorNames?: string | null;
  coordinatorName?: string | null;
  hodName?: string | null;
  externalExaminerName?: string | null;
  school?: string | null;
  college?: string | null;
  graduationYear?: number | null;
};

type Tx = Prisma.TransactionClient;

async function createSections(
  tx: Tx,
  chapterId: string,
  sections: SectionTemplate[],
  parentSectionId: string | null,
) {
  for (const [position, item] of sections.entries()) {
    const created = await tx.section.create({
      data: { chapterId, parentSectionId, title: item.title, templateKey: item.key, position },
    });
    if (item.children?.length) await createSections(tx, chapterId, item.children, created.id);
  }
}

export function createOwned(userId: string, data: CreateInput) {
  const templateId = resolveTemplateId(data.templateId, data.projectType);
  const template = getTemplate(templateId);
  if (!template) throw new AppError(400, "TEMPLATE_NOT_FOUND", "Unknown project template");
  const { templateId: _ignored, ...fields } = data;
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        ...fields,
        institution: fields.institution || template.institution,
        department: fields.department || template.department,
        programme: fields.programme || template.programme,
        referenceStyle: fields.referenceStyle || template.referenceStyle,
        templateId,
        ownerId: userId,
        documents: {
          create: template.documents.map((doc, position) => ({
            type: doc.type,
            title: doc.title,
            numbering: doc.numbering,
            isEnabled: !doc.optional,
            content: fillPlaceholders(doc.defaultContent || "", { title: data.title }),
            position,
          })),
        },
      },
    });
    for (const [position, chapter] of template.chapters.entries()) {
      const created = await tx.chapter.create({
        data: {
          projectId: project.id,
          number: chapter.number,
          title: chapter.title,
          templateKey: chapter.key,
          position,
        },
      });
      await createSections(tx, created.id, chapter.sections, null);
    }
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
    studentName: string | null;
    registrationNumber: string | null;
    supervisorNames: string | null;
    coordinatorName: string | null;
    hodName: string | null;
    externalExaminerName: string | null;
    school: string | null;
    college: string | null;
    graduationYear: number | null;
  }>,
) {
  return prisma.project.update({ where: { id: projectId }, data });
}
export function deleteOwned(projectId: string, ownerId: string) {
  return prisma.project.deleteMany({ where: { id: projectId, ownerId } });
}
