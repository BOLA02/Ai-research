import { prisma } from "../../lib/prisma";
import { resolveText } from "../../citations";
import { DEFAULT_TEMPLATE_ID, getTemplate } from "../../templates";
import { loadReportContext } from "../report/report.context";
import { buildIndex } from "../report/report.service";
import { buildDocx } from "./docx-builder";
import type { ExportModel, FigureBlock, SectionBlock, TableBlock } from "./export.model";
import { awardFor, departmentLine, imageSize } from "./export.util";

const SPECIAL = new Set(["COVER_PAGE", "FLY_LEAF", "TITLE_PAGE", "APPENDIX", "CUSTOM"]);

export async function buildExportModel(userId: string, projectId: string): Promise<ExportModel> {
  const context = await loadReportContext(userId, projectId);
  const { project } = context;
  const index = buildIndex(context);
  const template = getTemplate(project.templateId ?? DEFAULT_TEMPLATE_ID) ?? getTemplate(DEFAULT_TEMPLATE_ID)!;
  const text = (value: string) => resolveText(value, index);

  const [figureRows, tableRows] = await Promise.all([
    prisma.figure.findMany({ where: { projectId }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] }),
    prisma.reportTable.findMany({ where: { projectId }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] }),
  ]);
  const figureNumber = new Map(index.figures.map((item) => [item.id, item.number]));
  const tableNumber = new Map(index.tables.map((item) => [item.id, item.number]));

  const figures: (FigureBlock & { sectionId: string | null })[] = figureRows.map((row) => {
    const bytes = row.imageData ? Buffer.from(row.imageData) : null;
    const size = bytes ? imageSize(bytes) : null;
    return {
      id: row.id,
      sectionId: row.sectionId,
      number: figureNumber.get(row.id) ?? 0,
      caption: text(row.caption),
      source: row.sourceNote ? text(row.sourceNote) : null,
      image: bytes && size ? { data: bytes, ...size } : null,
    };
  });
  const tables: (TableBlock & { sectionId: string | null })[] = tableRows.map((row) => ({
    id: row.id,
    sectionId: row.sectionId,
    number: tableNumber.get(row.id) ?? 0,
    caption: text(row.caption),
    source: row.sourceNote ? text(row.sourceNote) : null,
    columns: (row.columns as string[]).map(text),
    rows: (row.rows as string[][]).map((cells) => cells.map(text)),
  }));

  const sectionBlock = (section: (typeof context.sections)[number]): SectionBlock => ({
    id: section.id,
    number: section.number,
    title: section.title,
    depth: section.depth,
    text: text(section.content),
    figures: figures.filter((figure) => figure.sectionId === section.id),
    tables: tables.filter((table) => table.sectionId === section.id),
  });

  const front = context.documents
    .filter((doc) => doc.isEnabled && !SPECIAL.has(doc.type))
    .filter((doc) => !(doc.type === "DEDICATION" && !doc.content.trim()))
    .map((doc) => ({ id: doc.id, type: doc.type, title: doc.title, text: text(doc.content) }));

  const cited = index.sources.filter((entry) => entry.citationCount > 0);

  return {
    title: project.title,
    style: index.style,
    format: template.format,
    award: awardFor(project.programme),
    institution: project.institution ?? template.institution,
    location: template.location,
    department: departmentLine(project.department ?? template.department),
    college: (project.college ?? "").trim(),
    school: (project.school ?? "").trim(),
    studentName: (project.studentName ?? "").trim(),
    registrationNumber: (project.registrationNumber ?? "").trim(),
    year: project.graduationYear ?? new Date().getFullYear(),
    signatories: [
      { role: "Project Supervisor", name: project.supervisorNames ?? "" },
      { role: "Project Coordinator", name: project.coordinatorName ?? "" },
      { role: "Head of Department", name: project.hodName ?? "" },
      { role: "External Examiner", name: project.externalExaminerName ?? "" },
    ],
    front,
    chapters: context.chapters.map((chapter) => ({
      id: chapter.id,
      number: chapter.number,
      title: chapter.title,
      sections: context.sections.filter((section) => section.chapterId === chapter.id).map(sectionBlock),
    })),
    references: cited.map((entry) => ({ citeKey: entry.citeKey, number: entry.number, formatted: entry.formatted })),
    appendices: context.documents.filter((doc) => doc.isEnabled && (doc.type === "APPENDIX" || doc.type === "CUSTOM")).map((doc) => ({ id: doc.id, title: doc.title, text: text(doc.content) })),
    figures: index.figures.map((item) => ({ id: item.id, number: item.number, caption: figures.find((figure) => figure.id === item.id)?.caption ?? "" })),
    tables: index.tables.map((item) => ({ id: item.id, number: item.number, caption: tables.find((table) => table.id === item.id)?.caption ?? "" })),
  };
}

export async function exportDocx(userId: string, projectId: string) {
  const model = await buildExportModel(userId, projectId);
  return { buffer: await buildDocx(model), title: model.title };
}
