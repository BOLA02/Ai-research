const WORDS = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN", "TWENTY"];

/** 1 becomes "ONE". Beyond twenty the numeral is used. */
export const chapterWord = (n: number) => (n >= 1 && n <= 20 ? WORDS[n] : String(n));

export function toRoman(n: number) {
  const table: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let rest = n;
  let out = "";
  for (const [value, symbol] of table)
    while (rest >= value) {
      out += symbol;
      rest -= value;
    }
  return out;
}

/** Fills each run of underscores, in order, with the matching value. A missing value leaves its blank. */
export function fillBlanks(text: string, values: (string | null | undefined)[]) {
  let index = 0;
  return text.replace(/_{5,}/g, (blank) => {
    const value = values[index];
    index += 1;
    return value ? value : blank;
  });
}

/** Paragraphs are separated by blank lines. Single line breaks inside a paragraph are kept. */
export function toParagraphs(text: string): string[][] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.split("\n").map((line) => line.trimEnd()))
    .filter((lines) => lines.some((line) => line.trim()));
}

/** Splits "plain *italic* plain" into pieces. */
export function italicPieces(text: string): { text: string; italics: boolean }[] {
  return text
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part) => (part.startsWith("*") && part.endsWith("*") && part.length > 2 ? { text: part.slice(1, -1), italics: true } : { text: part, italics: false }));
}

export type StyledPiece = { text: string; bold: boolean; italics: boolean; underline: boolean };

/**
 * Splits student text into pieces by emphasis: **bold**, *italic* and ++underline++.
 * Marks that are not closed on the same line stay as plain text.
 */
export function styledPieces(text: string): StyledPiece[] {
  return text
    .split(/(\*\*\*[^*\n]+\*\*\*|\*\*[^*\n]+\*\*|\+\+[^+\n]+\+\+|\*[^*\n]+\*)/g)
    .filter(Boolean)
    .map((part) => {
      if (part.length > 6 && part.startsWith("***") && part.endsWith("***")) return { text: part.slice(3, -3), bold: true, italics: true, underline: false };
      if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) return { text: part.slice(2, -2), bold: true, italics: false, underline: false };
      if (part.length > 4 && part.startsWith("++") && part.endsWith("++")) return { text: part.slice(2, -2), bold: false, italics: false, underline: true };
      if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) return { text: part.slice(1, -1), bold: false, italics: true, underline: false };
      return { text: part, bold: false, italics: false, underline: false };
    });
}

export const AWARDS: Record<string, string> = {
  HND: "HIGHER NATIONAL DIPLOMA",
  ND: "NATIONAL DIPLOMA",
  PGD: "POSTGRADUATE DIPLOMA",
};

export const awardFor = (programme: string | null | undefined) => AWARDS[(programme ?? "").trim().toUpperCase()] ?? (programme ? programme.toUpperCase() : "HIGHER NATIONAL DIPLOMA");

export function departmentLine(department: string | null | undefined) {
  const name = (department ?? "").trim();
  if (!name) return "";
  return /^(department|dept)\b/i.test(name) ? name.toUpperCase() : `DEPARTMENT OF ${name.toUpperCase()}`;
}

/** Width and height in pixels read from the file header, or null when the bytes are not a PNG or JPEG. */
export function imageSize(bytes: Buffer): { width: number; height: number; type: "png" | "jpg" } | null {
  if (bytes.length > 24 && bytes.subarray(1, 4).toString("ascii") === "PNG") return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), type: "png" };
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) return null;
      const marker = bytes[offset + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7), type: "jpg" };
      offset += 2 + bytes.readUInt16BE(offset + 2);
    }
  }
  return null;
}

/** Scales an image to fit inside a box, never enlarging it. */
export function fit(width: number, height: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
