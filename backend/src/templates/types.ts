export type Guidance = {
  /** One or two lines on why this part exists and what the examiner looks for. */
  purpose: string;
  /** Question-driven prompts that replace a blank text box. */
  prompts: string[];
  /** Short do/don't advice taken from the department guidelines. */
  tips?: string[];
};

export type SectionTemplate = {
  key: string;
  title: string;
  guidance: Guidance;
  optional?: boolean;
  children?: SectionTemplate[];
};

export type ChapterTemplate = {
  key: string;
  number: number;
  title: string;
  sections: SectionTemplate[];
};

export type DocumentNumbering = "none" | "roman";

export type DocumentTemplate = {
  /** Must match a ProjectDocumentType enum value. */
  type:
    | "COVER_PAGE"
    | "FLY_LEAF"
    | "TITLE_PAGE"
    | "DECLARATION"
    | "APPROVAL_PAGE"
    | "DEDICATION"
    | "ACKNOWLEDGEMENT"
    | "TABLE_OF_CONTENTS"
    | "LIST_OF_SYMBOLS_ABBREVIATIONS"
    | "LIST_OF_TABLES"
    | "LIST_OF_FIGURES"
    | "ABSTRACT";
  title: string;
  numbering: DocumentNumbering;
  /** Generated or fixed by the department; the student does not type these. */
  generated?: boolean;
  optional?: boolean;
  /** Starting text. `{{title}}` is replaced with the project title. */
  defaultContent?: string;
  guidance: Guidance;
};

export type Requirement = {
  id: string;
  sectionKey: string;
  /** Minimum number of items (e.g. related works) the section must discuss. */
  minItems: number;
  message: string;
};

export type Milestone = {
  id: string;
  title: string;
  timing: string;
  detail: string;
};

export type ReportTemplate = {
  id: string;
  name: string;
  institution: string;
  department: string;
  programme: string;
  projectType: "DESIGN" | "MAINTENANCE";
  referenceStyle: "IEEE";
  /** True when the department has not yet confirmed this structure. */
  provisional?: boolean;
  documents: DocumentTemplate[];
  chapters: ChapterTemplate[];
  requirements: Requirement[];
  milestones: Milestone[];
  format: FormatRules;
};

export type FormatRules = {
  paper: "A4";
  fontFamily: string;
  fontSizePt: number;
  bodyLineSpacing: number;
  abstractLineSpacing: number;
  marginsMm: { left: number; top: number; right: number; bottom: number };
  justified: boolean;
  paragraphIndent: boolean;
  pageNumberPosition: "top-right";
  preliminaryNumbering: "roman";
  maxHeadingDepth: number;
  coverFontSizePt: number;
  titlePageFontSizePt: number;
  captionStyle: { bold: boolean; centred: boolean };
  tableFontMinPt: number;
  appendixLabel: "roman";
  minPages: number;
  maxPages: number;
};
