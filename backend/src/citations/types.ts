export type ReferenceStyle = "IEEE" | "APA";

export type SourceType =
  | "BOOK"
  | "BOOK_CHAPTER"
  | "JOURNAL"
  | "CONFERENCE"
  | "WEBSITE"
  | "THESIS"
  | "REPORT"
  | "STANDARD"
  | "PATENT"
  | "OTHER";

export type Author = { family: string; given?: string };

/** The bibliographic data a style needs. Mirrors the Source table. */
export type SourceData = {
  type: SourceType;
  authors: Author[];
  editors: Author[];
  title: string;
  containerTitle?: string | null;
  year?: number | null;
  month?: number | null;
  day?: number | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
  edition?: string | null;
  publisher?: string | null;
  place?: string | null;
  institution?: string | null;
  degree?: string | null;
  number?: string | null;
  url?: string | null;
  doi?: string | null;
};

export const normaliseStyle = (value: string | null | undefined): ReferenceStyle =>
  value && value.toUpperCase().startsWith("APA") ? "APA" : "IEEE";
