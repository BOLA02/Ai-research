/**
 * In-text markers a student types or inserts:
 *   [@glover2009]              one source
 *   [@glover2009, p. 33]       one source with a locator
 *   [@a; @b]                   several sources
 *   [fig:block-diagram]        a figure
 *   [tab:results]              a table
 */
export type CitationItem = { key: string; locator?: string };
export type Marker =
  | { kind: "cite"; raw: string; start: number; items: CitationItem[] }
  | { kind: "fig" | "tab"; raw: string; start: number; label: string };

const CITE = /\[@[^\]]+\]/g;
const ASSET = /\[(fig|tab):([A-Za-z0-9_-]+)\]/g;

export function parseCitation(raw: string): CitationItem[] {
  return raw
    .slice(1, -1)
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith("@"))
    .map((part) => {
      const [key, ...rest] = part.slice(1).split(",");
      const locator = rest.join(",").trim();
      return { key: key.trim(), ...(locator ? { locator } : {}) };
    })
    .filter((item) => item.key);
}

/** All markers in a text, in the order they appear. */
export function findMarkers(text: string): Marker[] {
  const found: Marker[] = [];
  for (const match of text.matchAll(CITE)) found.push({ kind: "cite", raw: match[0], start: match.index ?? 0, items: parseCitation(match[0]) });
  for (const match of text.matchAll(ASSET)) found.push({ kind: match[1] as "fig" | "tab", raw: match[0], start: match.index ?? 0, label: match[2] });
  return found.sort((a, b) => a.start - b.start);
}

export const hasMarkers = (text: string) => findMarkers(text).length > 0;
