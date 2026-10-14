/**
 * Paragraphs, list items and alignment marks in a writer's text. The server reads
 * the same rules when it builds the Word file (backend export.util.ts, parseUnits).
 */
export type Align = "left" | "right" | "center" | "justify";

export type Unit =
  | { kind: "para"; lines: string[]; align?: Align }
  | { kind: "item"; marker: string; text: string; align?: Align };

const TOKEN = /^\{(left|right|center|justify)\}[ \t]?/;
const ITEM = /^(?:(-|•)|(\d{1,2}[.)]|\([a-z]\)|[a-z]\)|\((?:i|ii|iii|iv|v|vi|vii|viii|ix|x)\)))[ \t]+(\S.*)$/;

export function parseUnits(text: string): Unit[] {
  const units: Unit[] = [];
  let open: Extract<Unit, { kind: "para" }> | null = null;
  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      open = null;
      continue;
    }
    const tagged = TOKEN.exec(line);
    const align = tagged ? (tagged[1] as Align) : undefined;
    const rest = tagged ? line.slice(tagged[0].length) : line;
    const item = ITEM.exec(rest);
    if (item) {
      units.push({ kind: "item", marker: item[1] ? "•" : item[2], text: item[3], align });
      open = null;
    } else if (open) {
      open.lines.push(rest);
    } else {
      open = { kind: "para", lines: [rest], align };
      units.push(open);
    }
  }
  return units;
}

type Line = { start: number; end: number; text: string; unitStart: boolean };

/** Lines of the text with their positions, and whether each one begins a paragraph or list item. */
function lines(text: string): Line[] {
  const out: Line[] = [];
  let position = 0;
  let previous: "blank" | "item" | "para" = "blank";
  for (const raw of text.split("\n")) {
    const body = raw.replace(TOKEN, "");
    const blank = !raw.trim();
    const isItem = !blank && ITEM.test(body);
    out.push({ start: position, end: position + raw.length, text: raw, unitStart: !blank && (isItem || previous === "blank" || previous === "item") });
    previous = blank ? "blank" : isItem ? "item" : "para";
    position += raw.length + 1;
  }
  return out;
}

/** The lines that start a paragraph or list item inside the selection (or the one the cursor is in). */
function touched(text: string, from: number, to: number): Line[] {
  const all = lines(text);
  const picked: Line[] = [];
  all.forEach((line, index) => {
    if (line.end < from || line.start > to) return;
    if (!line.text.trim()) return;
    let at = index;
    while (at > 0 && !all[at].unitStart) at -= 1; // a paragraph's later line belongs to the line that starts it
    if (!picked.includes(all[at])) picked.push(all[at]);
  });
  return picked;
}

/** The alignment mark of the paragraph or item at the cursor, if it has one. */
export function alignmentAt(text: string, at: number): Align | undefined {
  const line = touched(text, at, at)[0];
  return line ? (TOKEN.exec(line.text)?.[1] as Align | undefined) : undefined;
}

/** Sets the alignment of every paragraph and item touched by the selection. "justify" is also written as a mark. */
export function setAlignment(text: string, from: number, to: number, align: Align): { text: string; from: number; to: number } {
  let next = text;
  let shiftFrom = 0;
  let shiftTo = 0;
  // Work from the end so earlier positions stay valid.
  for (const line of touched(text, from, to).reverse()) {
    const existing = TOKEN.exec(line.text);
    const replacement = `{${align}}`;
    next = next.slice(0, line.start) + replacement + next.slice(line.start + (existing ? existing[0].replace(/\s+$/, "").length : 0));
    const delta = replacement.length - (existing ? existing[0].replace(/\s+$/, "").length : 0);
    if (line.start <= from) shiftFrom += delta;
    if (line.start <= to) shiftTo += delta;
  }
  return { text: next, from: from + shiftFrom, to: to + shiftTo };
}

/** Turns the lines in the selection into a list, or back into plain lines if they already are one. */
export function toggleList(text: string, from: number, to: number, kind: "bullet" | "number"): { text: string; from: number; to: number } {
  const all = lines(text);
  const chosen = all.filter((line) => line.text.trim() && line.end >= from && line.start <= to);
  if (chosen.length === 0) return { text, from, to };
  const prefixOf = (line: Line) => {
    const tag = TOKEN.exec(line.text)?.[0] ?? "";
    const rest = line.text.slice(tag.length);
    const match = ITEM.exec(rest);
    return { tag, rest, match };
  };
  const allSame = chosen.every((line) => {
    const { match } = prefixOf(line);
    return match && (kind === "bullet" ? Boolean(match[1]) : Boolean(match[2] && /^\d/.test(match[2])));
  });
  let next = "";
  let cursor = 0;
  let n = 0;
  let shiftFrom = 0;
  let shiftTo = 0;
  for (const line of chosen) {
    const { tag, rest, match } = prefixOf(line);
    const body = match ? match[3] : rest;
    n += 1;
    const marker = allSame ? "" : kind === "bullet" ? "- " : `${n}. `;
    const replaced = `${tag}${marker}${body}`;
    next += text.slice(cursor, line.start) + replaced;
    cursor = line.end;
    const delta = replaced.length - line.text.length;
    if (line.start <= from) shiftFrom += delta;
    if (line.start <= to) shiftTo += delta;
  }
  next += text.slice(cursor);
  return { text: next, from: Math.max(0, from + shiftFrom), to: Math.max(0, to + shiftTo) };
}

/** Text without alignment marks, for word counts and for the writing coach. */
export const stripMarks = (text: string) => text.replace(/^\{(?:left|right|center|justify)\}[ \t]?/gm, "");
