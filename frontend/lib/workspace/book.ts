/** Small helpers the book preview shares with the Word export (backend export.util.ts). */
const WORDS = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN", "TWENTY"];
export const chapterWord = (n: number) => (n >= 1 && n <= 20 ? WORDS[n] : String(n));

export function toRoman(n: number, lower = false) {
  const table: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let rest = n;
  let out = "";
  for (const [value, symbol] of table)
    while (rest >= value) {
      out += symbol;
      rest -= value;
    }
  return lower ? out.toLowerCase() : out;
}

export function fillBlanks(text: string, values: (string | null | undefined)[]) {
  let index = 0;
  return text.replace(/_{5,}/g, (blank) => {
    const value = values[index];
    index += 1;
    return value ? value : blank;
  });
}

/** Pictures are shrunk to fit the page, never enlarged. */
export function fit(width: number, height: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export type PreviewFigure = { id: string; number: number; caption: string; source: string | null; image: { width: number; height: number } | null };
export type PreviewTable = { id: string; number: number; caption: string; source: string | null; columns: string[]; rows: string[][] };
export type PreviewSection = {
  id: string; number: string; title: string; depth: number;
  body: ({ t: "text"; text: string } | { t: "calc"; calc: { id: string; title: string; lines: string[] } })[];
  figures: PreviewFigure[]; tables: PreviewTable[];
};
export type PreviewModel = {
  title: string; style: "IEEE" | "APA";
  format: { fontFamily: string; fontSizePt: number; bodyLineSpacing: number; abstractLineSpacing: number; marginsMm: { left: number; top: number; right: number; bottom: number }; justified: boolean; coverFontSizePt: number; titlePageFontSizePt: number; minPages: number; maxPages: number };
  award: string; institution: string; location: string; department: string; college: string; school: string;
  studentName: string; registrationNumber: string; year: number;
  signatories: { role: string; name: string }[];
  front: { id: string; type: string; title: string; text: string }[];
  chapters: { id: string; number: number; title: string; sections: PreviewSection[] }[];
  references: { citeKey: string; number: number | null; formatted: string }[];
  appendices: { id: string; title: string; text: string }[];
  figures: { id: string; number: number; caption: string }[];
  tables: { id: string; number: number; caption: string }[];
};
