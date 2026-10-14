import { apaInTextCore, formatApa } from "./apa";
import { formatIeee, ieeeInTextCore } from "./ieee";
import { findMarkers } from "./tokens";
import type { ReferenceStyle, SourceData } from "./types";

export * from "./types";
export * from "./tokens";
export { parseAuthors } from "./names";

export type IndexedSource = SourceData & { id: string; citeKey: string };

/** One piece of the report that can hold text, in the order it appears in the report. */
export type TextBlock = { id: string; kind: "document" | "section"; title: string; text: string };

export type SourceEntry = {
  id: string;
  citeKey: string;
  number: number | null;
  citationCount: number;
  formatted: string;
  inTextCore: string;
};

export type NumberedItem = { id: string; label: string; number: number };

/** A worked calculation, already evaluated, as lines of working ready for the report. */
export type CalculationEntry = { id: string; label: string; title: string; lines: string[] };

export type ReportIndex = {
  style: ReferenceStyle;
  citationWrap: { open: string; close: string; separator: string };
  /** In bibliography order. */
  sources: SourceEntry[];
  figures: NumberedItem[];
  tables: NumberedItem[];
  calculations: CalculationEntry[];
};

export function formatSource(source: SourceData, style: ReferenceStyle) {
  return style === "APA" ? formatApa(source) : formatIeee(source);
}

const firstAuthorKey = (source: SourceData) => (source.authors[0]?.family ?? source.title).toLowerCase();

export function buildSourceEntries(style: ReferenceStyle, sources: IndexedSource[], blocks: TextBlock[]): SourceEntry[] {
  const byKey = new Map(sources.map((source) => [source.citeKey, source]));
  const order: string[] = [];
  const counts = new Map<string, number>();
  for (const block of blocks)
    for (const marker of findMarkers(block.text))
      if (marker.kind === "cite")
        for (const item of marker.items) {
          const source = byKey.get(item.key);
          if (!source) continue;
          if (!counts.has(source.id)) order.push(source.id);
          counts.set(source.id, (counts.get(source.id) ?? 0) + 1);
        }

  const entries: SourceEntry[] = sources.map((source) => {
    const position = order.indexOf(source.id);
    const number = position >= 0 ? position + 1 : null;
    return {
      id: source.id,
      citeKey: source.citeKey,
      number,
      citationCount: counts.get(source.id) ?? 0,
      formatted: formatSource(source, style),
      inTextCore: style === "APA" ? apaInTextCore(source) : number ? ieeeInTextCore(number) : "?",
    };
  });

  if (style === "IEEE")
    // Cited sources in citation order, then uncited ones.
    return entries.sort((a, b) => (a.number ?? Infinity) - (b.number ?? Infinity) || a.citeKey.localeCompare(b.citeKey));
  const bySource = new Map(sources.map((source) => [source.id, source]));
  return entries.sort((a, b) => {
    const left = bySource.get(a.id)!;
    const right = bySource.get(b.id)!;
    return firstAuthorKey(left).localeCompare(firstAuthorKey(right)) || (left.year ?? 0) - (right.year ?? 0);
  });
}

export const citationWrap = (style: ReferenceStyle) => (style === "APA" ? { open: "(", close: ")", separator: "; " } : { open: "[", close: "]", separator: ", " });

/** Replaces markers in a text with the formatted citation or figure and table number. */
export function resolveText(text: string, index: ReportIndex): string {
  const bySourceKey = new Map(index.sources.map((entry) => [entry.citeKey, entry]));
  const figures = new Map(index.figures.map((item) => [item.label, item]));
  const tables = new Map(index.tables.map((item) => [item.label, item]));
  const calculations = new Map((index.calculations ?? []).map((item) => [item.label, item]));
  const { open, close, separator } = index.citationWrap;

  let out = "";
  let cursor = 0;
  for (const marker of findMarkers(text)) {
    out += text.slice(cursor, marker.start);
    cursor = marker.start + marker.raw.length;
    if (marker.kind === "cite") {
      const parts = marker.items.map((item) => {
        const entry = bySourceKey.get(item.key);
        if (!entry) return "?";
        return item.locator ? `${entry.inTextCore}, ${item.locator}` : entry.inTextCore;
      });
      out += `${open}${parts.join(separator)}${close}`;
    } else if (marker.kind === "calc") {
      // The working is written out in full, one line per step.
      const item = calculations.get(marker.label);
      out += item ? item.lines.join("\n") : "Calculation ?";
    } else {
      const item = (marker.kind === "fig" ? figures : tables).get(marker.label);
      const word = marker.kind === "fig" ? "Figure" : "Table";
      out += item ? `${word} ${item.number}` : `${word} ?`;
    }
  }
  return out + text.slice(cursor);
}
