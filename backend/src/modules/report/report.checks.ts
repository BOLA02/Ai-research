import { findMarkers, type ReferenceStyle, type ReportIndex, type SourceType, type IndexedSource, type TextBlock } from "../../citations";
import type { ReportTemplate, SectionTemplate } from "../../templates";
import type { SectionInfo } from "./report.numbering";

export type Severity = "error" | "warning" | "info" | "ok";
export type CheckLink = { kind: "section" | "document"; id: string } | { kind: "tool"; tool: "references" | "figures" | "tables" };
export type Check = { id: string; severity: Severity; title: string; detail: string; link?: CheckLink };

type DocumentRow = { id: string; type: string; title: string; content: string; isEnabled: boolean };
type AssetRow = { id: string; label: string; caption: string; sectionId: string | null; sourceNote: string | null };
type FigureRow = AssetRow & { isOriginal: boolean; mimeType: string | null };

export type CheckInput = {
  style: ReferenceStyle;
  template: ReportTemplate | undefined;
  documents: DocumentRow[];
  sections: SectionInfo[];
  blocks: TextBlock[];
  sources: IndexedSource[];
  figures: FigureRow[];
  tables: AssetRow[];
  index: ReportIndex;
};

const WORDS_PER_PAGE = 300;
const words = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);
const list = (items: string[], max = 4) => (items.length > max ? `${items.slice(0, max).join(", ")} and ${items.length - max} more` : items.join(", "));

/** Fields each kind of source needs before it can be formatted properly in either style. */
const REQUIRED: Record<SourceType, { field: keyof IndexedSource | "authors"; label: string }[]> = {
  BOOK: [{ field: "authors", label: "author" }, { field: "year", label: "year" }, { field: "publisher", label: "publisher" }],
  BOOK_CHAPTER: [{ field: "authors", label: "author" }, { field: "containerTitle", label: "book title" }, { field: "year", label: "year" }, { field: "publisher", label: "publisher" }, { field: "pages", label: "pages" }],
  JOURNAL: [{ field: "authors", label: "author" }, { field: "containerTitle", label: "journal" }, { field: "year", label: "year" }, { field: "pages", label: "pages" }],
  CONFERENCE: [{ field: "authors", label: "author" }, { field: "containerTitle", label: "conference" }, { field: "year", label: "year" }],
  WEBSITE: [{ field: "url", label: "web address" }, { field: "year", label: "year" }],
  THESIS: [{ field: "authors", label: "author" }, { field: "year", label: "year" }, { field: "institution", label: "institution" }, { field: "degree", label: "degree or project type" }],
  REPORT: [{ field: "year", label: "year" }, { field: "institution", label: "organisation" }],
  STANDARD: [{ field: "number", label: "standard number" }, { field: "year", label: "year" }],
  PATENT: [{ field: "authors", label: "inventor" }, { field: "number", label: "patent number" }, { field: "year", label: "year" }],
  OTHER: [{ field: "year", label: "year" }],
};

const missingFields = (source: IndexedSource) =>
  REQUIRED[source.type]
    .filter(({ field }) => {
      const value = source[field as keyof IndexedSource];
      return Array.isArray(value) ? value.length === 0 : value === null || value === undefined || value === "";
    })
    .map(({ label }) => label);

function findTemplateSection(sections: SectionTemplate[], key: string): SectionTemplate | undefined {
  for (const section of sections) {
    if (section.key === key) return section;
    const inner = findTemplateSection(section.children ?? [], key);
    if (inner) return inner;
  }
}

export function runChecks(input: CheckInput): Check[] {
  const { style, template, documents, sections, blocks, sources, figures, tables, index } = input;
  const checks: Check[] = [];
  const byKey = new Map(sources.map((source) => [source.citeKey, source]));
  const sectionById = new Map(sections.map((section) => [section.id, section]));

  /* Citations that point at nothing, and sources nobody cites. */
  const unknown: { key: string; where: string; block: TextBlock }[] = [];
  const unknownFig: { label: string; where: string; block: TextBlock; kind: "fig" | "tab" }[] = [];
  const figureLabels = new Set(figures.map((figure) => figure.label));
  const tableLabels = new Set(tables.map((table) => table.label));
  const referencedFigures = new Set<string>();
  const referencedTables = new Set<string>();
  for (const block of blocks)
    for (const marker of findMarkers(block.text)) {
      if (marker.kind === "cite") for (const item of marker.items) if (!byKey.has(item.key)) unknown.push({ key: item.key, where: block.title, block });
      if (marker.kind === "fig" || marker.kind === "tab") {
        const known = marker.kind === "fig" ? figureLabels : tableLabels;
        if (known.has(marker.label)) (marker.kind === "fig" ? referencedFigures : referencedTables).add(marker.label);
        else unknownFig.push({ label: marker.label, where: block.title, block, kind: marker.kind });
      }
    }

  const linkTo = (block: TextBlock): CheckLink => ({ kind: block.kind, id: block.id });

  if (unknown.length)
    checks.push({ id: "unknown-citations", severity: "error", title: "Citations that match no source", detail: `${list(unknown.map((item) => `[@${item.key}] in ${item.where}`))}. Add the source, or fix the key.`, link: linkTo(unknown[0].block) });
  else checks.push({ id: "unknown-citations", severity: "ok", title: "Every citation matches a source", detail: "" });

  if (unknownFig.length)
    checks.push({ id: "unknown-refs", severity: "error", title: "Figure or table references that match nothing", detail: `${list(unknownFig.map((item) => `[${item.kind}:${item.label}] in ${item.where}`))}.`, link: linkTo(unknownFig[0].block) });

  const uncited = index.sources.filter((entry) => entry.citationCount === 0);
  if (sources.length === 0) checks.push({ id: "no-sources", severity: "warning", title: "No sources added yet", detail: "Add the books, papers and websites you have read, then cite them in your text.", link: { kind: "tool", tool: "references" } });
  else if (uncited.length)
    checks.push({ id: "uncited-sources", severity: "warning", title: `${uncited.length} source${uncited.length === 1 ? " is" : "s are"} never cited`, detail: `${list(uncited.map((entry) => entry.citeKey))}. ${style === "IEEE" ? "Every entry in the list of references" : "Every reference"} must be cited in the text.`, link: { kind: "tool", tool: "references" } });
  else checks.push({ id: "uncited-sources", severity: "ok", title: "Every source is cited in the text", detail: "" });

  const incomplete = sources.map((source) => ({ source, missing: missingFields(source) })).filter((item) => item.missing.length);
  if (incomplete.length)
    checks.push({ id: "source-fields", severity: "warning", title: `${incomplete.length} source${incomplete.length === 1 ? " is" : "s are"} missing details`, detail: list(incomplete.map(({ source, missing }) => `${source.citeKey} (${missing.join(", ")})`), 3), link: { kind: "tool", tool: "references" } });

  /* Requirements from the department template, such as "at least 5 related works". */
  for (const rule of template?.requirements ?? []) {
    const target = sections.find((section) => section.templateKey === rule.sectionKey);
    if (!target) continue;
    const inside = new Set([target.id, ...sections.filter((section) => section.number.startsWith(`${target.number}.`)).map((section) => section.id)]);
    const cited = new Set<string>();
    for (const block of blocks)
      if (block.kind === "section" && inside.has(block.id))
        for (const marker of findMarkers(block.text)) if (marker.kind === "cite") for (const item of marker.items) if (byKey.has(item.key)) cited.add(item.key);
    checks.push(
      cited.size >= rule.minItems
        ? { id: rule.id, severity: "ok", title: `${cited.size} related works cited in ${target.number}`, detail: "" }
        : { id: rule.id, severity: "warning", title: `${cited.size} of ${rule.minItems} related works cited`, detail: rule.message, link: { kind: "section", id: target.id } },
    );
  }

  /* Figures and tables. */
  const unreferencedFigs = figures.filter((figure) => !referencedFigures.has(figure.label));
  if (unreferencedFigs.length)
    checks.push({ id: "figures-unreferenced", severity: "warning", title: `${unreferencedFigs.length} figure${unreferencedFigs.length === 1 ? " is" : "s are"} never mentioned in the text`, detail: `Refer to each figure in the text, for example [fig:${unreferencedFigs[0].label}]. ${list(unreferencedFigs.map((figure) => figure.label))}.`, link: { kind: "tool", tool: "figures" } });
  const unreferencedTabs = tables.filter((table) => !referencedTables.has(table.label));
  if (unreferencedTabs.length)
    checks.push({ id: "tables-unreferenced", severity: "warning", title: `${unreferencedTabs.length} table${unreferencedTabs.length === 1 ? " is" : "s are"} never mentioned in the text`, detail: `Refer to each table in the text, for example [tab:${unreferencedTabs[0].label}]. ${list(unreferencedTabs.map((table) => table.label))}.`, link: { kind: "tool", tool: "tables" } });
  const unplacedFigs = figures.filter((figure) => !figure.sectionId || !sectionById.has(figure.sectionId));
  const unplacedTabs = tables.filter((table) => !table.sectionId || !sectionById.has(table.sectionId));
  if (unplacedFigs.length) checks.push({ id: "figures-unplaced", severity: "warning", title: `${unplacedFigs.length} figure${unplacedFigs.length === 1 ? " is" : "s are"} not placed in a section`, detail: "Choose the section each figure belongs to so it gets the right number.", link: { kind: "tool", tool: "figures" } });
  if (unplacedTabs.length) checks.push({ id: "tables-unplaced", severity: "warning", title: `${unplacedTabs.length} table${unplacedTabs.length === 1 ? " is" : "s are"} not placed in a section`, detail: "Choose the section each table belongs to so it gets the right number.", link: { kind: "tool", tool: "tables" } });
  const unattributed = figures.filter((figure) => !figure.isOriginal && !figure.sourceNote);
  if (unattributed.length)
    checks.push({ id: "figures-attribution", severity: "error", title: `${unattributed.length} imported figure${unattributed.length === 1 ? " has" : "s have"} no source`, detail: `Your department requires every imported figure to be cited. ${list(unattributed.map((figure) => figure.label))}.`, link: { kind: "tool", tool: "figures" } });
  const noImage = figures.filter((figure) => !figure.mimeType);
  if (noImage.length) checks.push({ id: "figures-image", severity: "warning", title: `${noImage.length} figure${noImage.length === 1 ? " has" : "s have"} no image yet`, detail: list(noImage.map((figure) => figure.label)), link: { kind: "tool", tool: "figures" } });

  /* Structure and content. */
  const tooDeep = sections.filter((section) => section.depth > 2);
  if (tooDeep.length)
    checks.push({ id: "heading-depth", severity: "error", title: "Headings go deeper than three levels", detail: `Never subdivide beyond three levels such as 3.1.1: ${list(tooDeep.map((section) => section.number))}.`, link: { kind: "section", id: tooDeep[0].id } });

  const empty = sections.filter((section) => {
    const optional = template ? template.chapters.some((chapter) => findTemplateSection(chapter.sections, section.templateKey ?? "")?.optional) : false;
    return !optional && words(section.content) === 0;
  });
  if (empty.length)
    checks.push({ id: "empty-sections", severity: "info", title: `${empty.length} section${empty.length === 1 ? " is" : "s are"} still empty`, detail: list(empty.map((section) => `${section.number} ${section.title}`), 3), link: { kind: "section", id: empty[0].id } });
  else if (sections.length) checks.push({ id: "empty-sections", severity: "ok", title: "Every section has text", detail: "" });

  const abstract = documents.find((doc) => doc.type === "ABSTRACT");
  if (abstract) {
    if (findMarkers(abstract.content).length)
      checks.push({ id: "abstract-markers", severity: "error", title: "The abstract has citations or figure references", detail: "Leave references to figures, tables and sources out of the abstract.", link: { kind: "document", id: abstract.id } });
    else if (words(abstract.content) === 0) checks.push({ id: "abstract", severity: "info", title: "The abstract is empty", detail: "Write it last, when you know your results.", link: { kind: "document", id: abstract.id } });
    else checks.push({ id: "abstract", severity: "ok", title: "The abstract is written and has no citations", detail: "" });
  }

  const declaration = documents.find((doc) => doc.type === "DECLARATION" && doc.isEnabled);
  if (declaration && /_{5,}/.test(declaration.content))
    checks.push({ id: "declaration-blanks", severity: "warning", title: "The declaration still has blanks", detail: "Fill in your name and your supervisor's full name.", link: { kind: "document", id: declaration.id } });

  /* A rough length estimate, only a guide. */
  if (template) {
    const written = blocks.reduce((total, block) => total + words(block.text), 0);
    const pages = Math.round(written / WORDS_PER_PAGE + figures.length * 0.4 + tables.length * 0.3);
    checks.push({ id: "length", severity: "info", title: `Estimated length: about ${pages} page${pages === 1 ? "" : "s"}`, detail: `Your department expects ${template.format.minPages} to about ${template.format.maxPages} pages. This is only an estimate from your word count.` });
  }

  const order: Record<Severity, number> = { error: 0, warning: 1, info: 2, ok: 3 };
  return checks.sort((a, b) => order[a.severity] - order[b.severity]);
}
