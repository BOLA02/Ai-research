import {
  AlignmentType, Bookmark, BorderStyle, Document, Header, HeadingLevel, ImageRun, LeaderType, LineRuleType, NumberFormat, Packer,
  PageNumber, PageReference, Paragraph, Table, TableCell, TableRow, TabStopType, TextRun, WidthType,
} from "docx";
import { chapterWord, fillBlanks, fit, italicPieces, toParagraphs, toRoman } from "./export.util";
import type { ExportModel, FigureBlock, FrontPage, SectionBlock, TableBlock } from "./export.model";

const FONT = "Times New Roman";
const TWIPS_PER_MM = 56.6929;
const PAGE = { width: 11906, height: 16838 }; // A4 in twips
const mm = (n: number) => Math.round(n * TWIPS_PER_MM);
const SINGLE = 240;

type Heading = { bookmark: string; text: string; level: number; bold?: boolean };

export async function buildDocx(model: ExportModel): Promise<Buffer> {
  const f = model.format;
  const margins = { left: mm(f.marginsMm.left), right: mm(f.marginsMm.right), top: mm(f.marginsMm.top), bottom: mm(f.marginsMm.bottom) };
  const textWidth = PAGE.width - margins.left - margins.right;
  const size = f.fontSizePt * 2;
  const body = Math.round(f.bodyLineSpacing * SINGLE);
  const pageProps = { size: { width: PAGE.width, height: PAGE.height }, margin: margins };

  const run = (text: string, options: { bold?: boolean; italics?: boolean; size?: number; allCaps?: boolean } = {}) =>
    new TextRun({ text, font: FONT, size: options.size ?? size, bold: options.bold, italics: options.italics, allCaps: options.allCaps });

  /** Lines of one paragraph, joined with line breaks. */
  const lineRuns = (lines: string[], options: { size?: number; italics?: boolean } = {}) =>
    lines.flatMap((line, index) => italicPieces(line).map((piece, i) => new TextRun({ text: piece.text, font: FONT, size: options.size ?? size, italics: piece.italics || options.italics, break: index > 0 && i === 0 ? 1 : 0 })));

  const textParagraphs = (text: string, spacing = body) =>
    toParagraphs(text).map(
      (lines) =>
        new Paragraph({
          alignment: f.justified ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
          spacing: { line: spacing, lineRule: LineRuleType.AUTO, after: 240 },
          children: lineRuns(lines),
        }),
    );

  const centred = (text: string, options: { size?: number; bold?: boolean; after?: number; before?: number } = {}) =>
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: options.after ?? 240, before: options.before ?? 0, line: SINGLE }, children: [run(text, { bold: options.bold ?? true, size: options.size })] });

  /* ---------- headings, bookmarks and what the table of contents lists ---------- */
  const headings: Heading[] = [];
  let counter = 0;
  const bookmarkId = (prefix: string) => `${prefix}_${(counter += 1)}`;
  const listed = new Map<string, string>(); // key -> bookmark

  const mark = (key: string, prefix: string, text: string, level: number, bold = false) => {
    const bookmark = bookmarkId(prefix);
    listed.set(key, bookmark);
    headings.push({ bookmark, text, level, bold });
    return bookmark;
  };

  const frontHeading = (page: FrontPage | { id: string; title: string }) => {
    const bookmark = listed.get(`front:${page.id}`)!;
    return new Paragraph({ alignment: AlignmentType.CENTER, pageBreakBefore: true, spacing: { after: 240, line: SINGLE }, children: [new Bookmark({ id: bookmark, children: [run(page.title.toUpperCase(), { bold: true })] })] });
  };

  // Front matter is registered first, so the table of contents lists it before the chapters.
  const titleBookmark = mark("title-page", "title", "Title Page", 0);
  for (const page of model.front) mark(`front:${page.id}`, "front", page.title, 0);

  /* ---------- cover and title pages ---------- */
  const identityLines = (pt: number, bookmark?: string) => {
    const out: Paragraph[] = [];
    const add = (text: string, after = 240) => text && out.push(centred(text, { size: pt * 2, after }));
    if (bookmark) out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 480, line: SINGLE }, children: [new Bookmark({ id: bookmark, children: [run(model.title.toUpperCase(), { bold: true, size: pt * 2 })] })] }));
    else add(model.title.toUpperCase(), 480);
    add("RESEARCH PROJECT BY", 120);
    add(model.studentName.toUpperCase() || "YOUR NAME", 60);
    add(model.registrationNumber.toUpperCase() || "REGISTRATION NUMBER", 480);
    for (const line of [model.department, model.school, model.college, model.institution, model.location]) add(line.toUpperCase(), 60);
    out.push(centred("", { after: 240 }));
    add(`IN PARTIAL FULFILMENT OF THE REQUIREMENTS FOR THE AWARD OF ${model.award}`, 480);
    add(String(model.year));
    return out;
  };

  const cover = [new Paragraph({ spacing: { before: 1200 }, children: [] }), ...identityLines(f.coverFontSizePt)];
  const flyLeaf = [new Paragraph({ pageBreakBefore: true, children: [] })];

  /* ---------- front matter ---------- */
  const declaration = (page: FrontPage) => {
    const filled = fillBlanks(page.text, [model.studentName, model.signatories.find((s) => s.role === "Project Supervisor")?.name]);
    return [frontHeading(page), ...textParagraphs(filled), new Paragraph({ spacing: { before: 480 }, children: [run(`${model.studentName || "______________________"}    ${model.registrationNumber}    Signature ..................    Date ..............`)] }), new Paragraph({ children: [run("(Student's name and registration number)", { italics: true })] })];
  };

  const approval = (page: FrontPage) => {
    const certificate = toParagraphs(fillBlanks(page.text, [model.studentName, model.registrationNumber]))[0] ?? [];
    const blocks: Paragraph[] = [frontHeading(page), new Paragraph({ alignment: f.justified ? AlignmentType.JUSTIFIED : AlignmentType.LEFT, spacing: { line: body, after: 480 }, children: lineRuns(certificate) })];
    for (const { role, name } of model.signatories) {
      blocks.push(new Paragraph({ spacing: { before: 480 }, tabStops: [{ type: TabStopType.LEFT, position: Math.round(textWidth * 0.62) }], children: [run("................................................"), run("\t"), run("..............................")] }));
      blocks.push(new Paragraph({ tabStops: [{ type: TabStopType.LEFT, position: Math.round(textWidth * 0.62) }], children: [run(`${name ? name.toUpperCase() : ""}`, { bold: true }), run("\t"), run("DATE", { bold: true })] }));
      blocks.push(new Paragraph({ children: [run(role.toUpperCase(), { bold: true })] }));
    }
    return blocks;
  };

  const tocEntry = (heading: Heading) =>
    new Paragraph({
      spacing: { after: 80, line: SINGLE },
      indent: { left: heading.level * 360, right: 0 },
      tabStops: [{ type: TabStopType.RIGHT, position: textWidth, leader: LeaderType.DOT }],
      children: [run(heading.text, { bold: heading.bold }), run("\t"), new PageReference(heading.bookmark)],
    });

  /** Lists get their entries from a bookmark on each caption. */
  const listPage = (page: FrontPage, items: { id: string; number: number; caption: string }[], word: string) => {
    const entries = items.map((item) => {
      const bookmark = listed.get(`${word}:${item.id}`);
      const text = `${word} ${item.number}: ${item.caption}`;
      return new Paragraph({
        spacing: { after: 80, line: SINGLE },
        tabStops: [{ type: TabStopType.RIGHT, position: textWidth, leader: LeaderType.DOT }],
        children: bookmark ? [run(text), run("\t"), new PageReference(bookmark)] : [run(text)],
      });
    });
    return [frontHeading(page), ...(entries.length ? entries : [new Paragraph({ children: [run(`No ${word.toLowerCase()}s.`, { italics: true })] })])];
  };

  /* ---------- the body of the report ---------- */
  const caption = (kind: "Figure" | "Table", id: string, number: number, text: string) => {
    const key = `${kind}:${id}`;
    const bookmark = bookmarkId(kind === "Figure" ? "fig" : "tab");
    listed.set(key, bookmark);
    return new Paragraph({ alignment: AlignmentType.CENTER, keepNext: kind === "Table", spacing: { before: 120, after: 120, line: SINGLE }, children: [new Bookmark({ id: bookmark, children: [run(`${kind} ${number}: ${text}`, { bold: true })] })] });
  };

  const sourceLine = (source: string | null) => (source ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200, line: SINGLE }, children: [run(`Source: ${source}`, { size: 20, italics: true })] })] : []);

  const figureBlock = (figure: FigureBlock) => {
    const maxWidth = Math.round(((textWidth / TWIPS_PER_MM) / 25.4) * 96);
    const maxHeight = Math.round((11 / 2.54) * 96);
    const picture = figure.image
      ? (() => {
          const { width, height } = fit(figure.image.width, figure.image.height, maxWidth, maxHeight);
          return new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 60 }, children: [new ImageRun({ type: figure.image.type, data: figure.image.data, transformation: { width, height }, altText: { name: figure.caption, title: figure.caption, description: figure.caption } })] });
        })()
      : new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, children: [run("[Image not added yet]", { italics: true })] });
    return [picture, caption("Figure", figure.id, figure.number, figure.caption), ...sourceLine(figure.source)];
  };

  const tableBlock = (table: TableBlock) => {
    const columns = Math.max(1, table.columns.length);
    const cellSize = columns > 5 ? 20 : 22;
    const widths = Array.from({ length: columns }, () => Math.floor(textWidth / columns));
    const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
    const cell = (text: string, index: number) =>
      new TableCell({ width: { size: widths[index], type: WidthType.DXA }, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ spacing: { line: SINGLE }, children: lineRuns(text.split("\n"), { size: cellSize }) })] });
    const headerCells = table.columns.map((column, index) => new TableCell({ width: { size: widths[index], type: WidthType.DXA }, shading: { fill: "EDEDED" }, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ spacing: { line: SINGLE }, children: [run(column, { bold: true, size: cellSize })] })] }));
    return [
      caption("Table", table.id, table.number, table.caption),
      new Table({
        width: { size: textWidth, type: WidthType.DXA },
        columnWidths: widths,
        alignment: AlignmentType.CENTER,
        borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
        rows: [new TableRow({ tableHeader: true, cantSplit: true, children: headerCells }), ...table.rows.map((row) => new TableRow({ cantSplit: true, children: table.columns.map((_, index) => cell(row[index] ?? "", index)) }))],
      }),
      ...sourceLine(table.source),
      new Paragraph({ spacing: { after: 120 }, children: [] }),
    ];
  };

  const sectionBlocks = (section: SectionBlock) => {
    const bookmark = mark(`sec:${section.id}`, "sec", `${section.number} ${section.title}`, section.depth);
    return [
      new Paragraph({ heading: section.depth === 1 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3, keepNext: true, children: [new Bookmark({ id: bookmark, children: [run(`${section.number} ${section.title}`, { bold: true })] })] }),
      ...textParagraphs(section.text),
      ...section.figures.flatMap(figureBlock),
      ...section.tables.flatMap(tableBlock),
    ];
  };

  const chapterBlocks = model.chapters.flatMap((chapter) => {
    const label = `CHAPTER ${chapterWord(chapter.number)}`;
    const bookmark = mark(`ch:${chapter.id}`, "ch", `${label}: ${chapter.title.toUpperCase()}`, 0, true);
    return [
      new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 360, line: SINGLE }, children: [new Bookmark({ id: bookmark, children: [run(label, { bold: true }), new TextRun({ text: chapter.title.toUpperCase(), font: FONT, size, bold: true, break: 1 })] })] }),
      ...chapter.sections.flatMap(sectionBlocks),
    ];
  });

  const referencesBlocks = (() => {
    const bookmark = mark("refs", "refs", "REFERENCES", 0, true);
    const ieee = model.style === "IEEE";
    const entries = model.references.map(
      (reference) =>
        new Paragraph({
          alignment: f.justified ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
          spacing: { after: 120, line: SINGLE },
          indent: { left: ieee ? 567 : 720, hanging: ieee ? 567 : 720 },
          tabStops: ieee ? [{ type: TabStopType.LEFT, position: 567 }] : [],
          children: [...(ieee && reference.number ? [run(`[${reference.number}]`), run("\t")] : []), ...italicPieces(reference.formatted).map((piece) => run(piece.text, { italics: piece.italics }))],
        }),
    );
    return [
      new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 360, line: SINGLE }, children: [new Bookmark({ id: bookmark, children: [run("REFERENCES", { bold: true })] })] }),
      ...(entries.length ? entries : [new Paragraph({ children: [run("No sources have been cited yet.", { italics: true })] })]),
    ];
  })();

  const appendixBlocks = model.appendices.flatMap((appendix, index) => {
    const label = `APPENDIX ${toRoman(index + 1)}: ${appendix.title.toUpperCase()}`;
    const bookmark = mark(`app:${appendix.id}`, "app", label, 0, true);
    return [new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 360, line: SINGLE }, children: [new Bookmark({ id: bookmark, children: [run(label, { bold: true })] })] }), ...textParagraphs(appendix.text)];
  });

  /* The table of contents and lists need the bookmarks above, so the front matter is assembled last. */
  const frontBlocks = model.front.flatMap((page): Paragraph[] => {
    switch (page.type) {
      case "DECLARATION": return declaration(page);
      case "APPROVAL_PAGE": return approval(page);
      case "TABLE_OF_CONTENTS": return [frontHeading(page), ...headings.map(tocEntry)];
      case "LIST_OF_FIGURES": return listPage(page, model.figures, "Figure");
      case "LIST_OF_TABLES": return listPage(page, model.tables, "Table");
      case "ABSTRACT": return [frontHeading(page), ...textParagraphs(page.text, Math.round(f.abstractLineSpacing * SINGLE))];
      default: return [frontHeading(page), ...textParagraphs(page.text)];
    }
  });

  const header = (empty = false) => new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: empty ? [] : [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size })] })] });

  const doc = new Document({
    creator: model.studentName || "ProjectForge",
    title: model.title,
    features: { updateFields: true },
    styles: {
      default: { document: { run: { font: FONT, size }, paragraph: { spacing: { line: body } } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size, bold: true, color: "000000" }, paragraph: { outlineLevel: 0, keepNext: true } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size, bold: true, color: "000000" }, paragraph: { outlineLevel: 1, keepNext: true, spacing: { before: 240, after: 120, line: body } } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size, bold: true, color: "000000" }, paragraph: { outlineLevel: 2, keepNext: true, spacing: { before: 200, after: 120, line: body } } },
      ],
    },
    sections: [
      { properties: { page: pageProps }, children: [...cover, ...flyLeaf] },
      {
        properties: { titlePage: true, page: { ...pageProps, pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } } },
        headers: { default: header(), first: header(true) },
        children: [...identityLines(f.titlePageFontSizePt, titleBookmark), ...frontBlocks],
      },
      {
        properties: { page: { ...pageProps, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
        headers: { default: header() },
        children: [...chapterBlocks, ...referencesBlocks, ...appendixBlocks],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

