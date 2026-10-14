import type { ReferenceStyle } from "../../citations";
import type { FormatRules } from "../../templates";

export type FigureBlock = { id: string; number: number; caption: string; source: string | null; image: { data: Buffer; type: "png" | "jpg"; width: number; height: number } | null };
export type TableBlock = { id: string; number: number; caption: string; source: string | null; columns: string[]; rows: string[][] };

/** A worked calculation: a title and one line of working per step. */
export type CalcBlock = { id: string; title: string; lines: string[] };

/** A section's content is text, with calculations placed where the student put them. */
export type BodyPart = { t: "text"; text: string } | { t: "calc"; calc: CalcBlock };

export type SectionBlock = {
  id: string;
  number: string;
  title: string;
  /** 1 is a section such as 3.2, 2 a subsection such as 3.2.1. */
  depth: number;
  body: BodyPart[];
  figures: FigureBlock[];
  tables: TableBlock[];
};

export type FrontPage = { id: string; type: string; title: string; text: string };

/** Everything the Word builder needs. Markers in the text are already resolved. */
export type ExportModel = {
  title: string;
  style: ReferenceStyle;
  format: FormatRules;
  award: string;
  institution: string;
  location: string;
  department: string;
  college: string;
  school: string;
  studentName: string;
  registrationNumber: string;
  year: number;
  signatories: { role: string; name: string }[];
  front: FrontPage[];
  chapters: { id: string; number: number; title: string; sections: SectionBlock[] }[];
  references: { citeKey: string; number: number | null; formatted: string }[];
  appendices: { id: string; title: string; text: string }[];
  figures: { id: string; number: number; caption: string }[];
  tables: { id: string; number: number; caption: string }[];
};
