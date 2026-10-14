import { prisma } from "../../lib/prisma";
import { parseAuthors, type IndexedSource, type TextBlock } from "../../citations";
import { getProject } from "../projects";
import type { SectionInfo } from "./report.numbering";

export type ReportContext = Awaited<ReturnType<typeof loadReportContext>>;

/** Everything needed to number items, build the bibliography and run the checks, in report order. */
export async function loadReportContext(userId: string, projectId: string) {
  const { project } = await getProject(userId, projectId);
  const [documents, chapters, sourceRows, figures, tables] = await Promise.all([
    prisma.projectDocument.findMany({ where: { projectId }, orderBy: { position: "asc" } }),
    prisma.chapter.findMany({ where: { projectId }, orderBy: { position: "asc" }, include: { sections: { orderBy: { position: "asc" } } } }),
    prisma.source.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } }),
    prisma.figure.findMany({
      where: { projectId },
      select: { id: true, label: true, caption: true, sectionId: true, sourceNote: true, isOriginal: true, mimeType: true, position: true, createdAt: true },
    }),
    prisma.reportTable.findMany({ where: { projectId }, select: { id: true, label: true, caption: true, sectionId: true, sourceNote: true, position: true, createdAt: true } }),
  ]);

  const sections: SectionInfo[] = [];
  for (const chapter of chapters) {
    const children = new Map<string | null, typeof chapter.sections>();
    for (const section of chapter.sections) children.set(section.parentSectionId, [...(children.get(section.parentSectionId) ?? []), section]);
    const walk = (parent: string | null, prefix: string, depth: number) => {
      (children.get(parent) ?? []).forEach((section, index) => {
        const number = `${prefix}.${index + 1}`;
        sections.push({ id: section.id, chapterId: chapter.id, parentId: parent, number, title: section.title, templateKey: section.templateKey, content: section.content, depth, order: sections.length });
        walk(section.id, number, depth + 1);
      });
    };
    walk(null, String(chapter.number), 1);
  }

  const blocks: TextBlock[] = [
    ...documents.filter((doc) => doc.isEnabled).map((doc) => ({ id: doc.id, kind: "document" as const, title: doc.title, text: doc.content })),
    ...sections.map((section) => ({ id: section.id, kind: "section" as const, title: `${section.number} ${section.title}`, text: section.content })),
  ];

  const sources: IndexedSource[] = sourceRows.map((row) => ({
    id: row.id,
    citeKey: row.citeKey,
    type: row.type,
    authors: parseAuthors(row.authors),
    editors: parseAuthors(row.editors),
    title: row.title,
    containerTitle: row.containerTitle,
    year: row.year,
    month: row.month,
    day: row.day,
    volume: row.volume,
    issue: row.issue,
    pages: row.pages,
    edition: row.edition,
    publisher: row.publisher,
    place: row.place,
    institution: row.institution,
    degree: row.degree,
    number: row.number,
    url: row.url,
    doi: row.doi,
  }));

  return { project, documents, chapters, sections, blocks, sources, figures, tables };
}
