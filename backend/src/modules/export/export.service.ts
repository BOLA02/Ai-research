import { prisma } from "../../lib/prisma";
import { resolveText } from "../../citations";
import { DEFAULT_TEMPLATE_ID, getTemplate } from "../../templates";
import { loadReportContext } from "../report/report.context";
import { buildIndex } from "../report/report.service";
import { buildDocx } from "./docx-builder";
import type { BodyPart, CalcBlock, ExportModel, FigureBlock, SectionBlock, TableBlock } from "./export.model";
import { figureBytes } from "../figures/figure.service";
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

  const pictures = await Promise.all(
    figureRows.map(async (row) => {
      try {
        return await figureBytes(row);
      } catch (error) {
        console.error("Could not load a figure for the export", error instanceof Error ? error.message : error);
        return null;
      }
    }),
  );
  const figures: (FigureBlock & { sectionId: string | null })[] = figureRows.map((row, at) => {
    const bytes = pictures[at];
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

  const calcByLabel = new Map(context.calculations.map((row) => [row.label, row]));
  const asBlock = (row: (typeof context.calculations)[number]): CalcBlock => ({ id: row.id, title: row.title, lines: row.result.lines });

  /** Calculations sit where the student put them: a paragraph that holds only [calc:label]. Any left over go at the end. */
  const bodyOf = (section: (typeof context.sections)[number]): BodyPart[] => {
    const parts: BodyPart[] = [];
    const used = new Set<string>();
    let pending: string[] = [];
    const flush = () => {
      if (pending.length) parts.push({ t: "text", text: pending.join("\n\n") });
      pending = [];
    };
    for (const paragraph of section.content.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
      const alone = /^\s*\[calc:([A-Za-z0-9_-]+)\]\s*$/.exec(paragraph);
      const row = alone ? calcByLabel.get(alone[1]) : undefined;
      if (row) {
        flush();
        parts.push({ t: "calc", calc: asBlock(row) });
        used.add(row.id);
      } else if (paragraph.trim()) pending.push(text(paragraph));
    }
    flush();
    for (const row of context.calculations) if (row.sectionId === section.id && !used.has(row.id)) parts.push({ t: "calc", calc: asBlock(row) });
    return parts;
  };

  const sectionBlock = (section: (typeof context.sections)[number]): SectionBlock => ({
    id: section.id,
    number: section.number,
    title: section.title,
    depth: section.depth,
    body: bodyOf(section),
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
