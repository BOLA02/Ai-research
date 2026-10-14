/** Shapes returned by the ProjectForge API. */

export type ApiProject = {
  id: string;
  title: string;
  institution: string | null;
  department: string | null;
  programme: string | null;
  projectType: string | null;
  referenceStyle: string | null;
  templateId: string | null;
  studentName: string | null;
  registrationNumber: string | null;
  supervisorNames: string | null;
  coordinatorName: string | null;
  hodName: string | null;
  externalExaminerName: string | null;
  school: string | null;
  college: string | null;
  graduationYear: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiDocument = {
  id: string;
  type: string;
  title: string;
  content: string;
  position: number;
  isEnabled: boolean;
  numbering: "none" | "roman";
  updatedAt: string;
};

export type ApiSection = {
  id: string;
  chapterId: string;
  parentSectionId: string | null;
  title: string;
  templateKey: string | null;
  content: string;
  position: number;
};

export type ApiChapter = {
  id: string;
  number: number;
  title: string;
  templateKey: string | null;
  position: number;
  sections: ApiSection[];
};

export type Guidance = { purpose: string; prompts: string[]; tips?: string[] };

export type TemplateSection = {
  key: string;
  title: string;
  guidance: Guidance;
  optional?: boolean;
  children?: TemplateSection[];
};

export type TemplateChapter = {
  key: string;
  number: number;
  title: string;
  studentDefined?: boolean;
  sections: TemplateSection[];
};

export type TemplateDocument = {
  type: string;
  title: string;
  numbering: "none" | "roman";
  generated?: boolean;
  optional?: boolean;
  guidance: Guidance;
};

export type Template = {
  id: string;
  name: string;
  institution: string;
  department: string;
  programme: string;
  projectType: "DESIGN" | "MAINTENANCE";
  referenceStyle: string;
  documents: TemplateDocument[];
  chapters: TemplateChapter[];
  requirements: { id: string; sectionKey: string; minItems: number; message: string }[];
  milestones: { id: string; title: string; timing: string; detail: string }[];
  format: {
    fontFamily: string;
    fontSizePt: number;
    bodyLineSpacing: number;
    justified: boolean;
    marginsMm: { left: number; top: number; right: number; bottom: number };
    minPages: number;
    maxPages: number;
  };
};

export type TemplateSummary = Pick<
  Template,
  "id" | "name" | "institution" | "department" | "programme" | "projectType"
>;

/* ---- Sources, figures, tables and checks ---- */

export type ReferenceStyle = "IEEE" | "APA";

export type SourceType = "BOOK" | "BOOK_CHAPTER" | "JOURNAL" | "CONFERENCE" | "WEBSITE" | "THESIS" | "REPORT" | "STANDARD" | "PATENT" | "OTHER";

export type Author = { family: string; given?: string };

export type ApiSource = {
  id: string;
  citeKey: string;
  type: SourceType;
  authors: Author[];
  editors: Author[];
  title: string;
  containerTitle: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  edition: string | null;
  publisher: string | null;
  place: string | null;
  institution: string | null;
  degree: string | null;
  number: string | null;
  url: string | null;
  doi: string | null;
};

export type SourceInput = Partial<Omit<ApiSource, "id" | "citeKey">> & { type: SourceType; title: string; citeKey?: string };

export type ApiFigure = {
  id: string;
  label: string;
  caption: string;
  sectionId: string | null;
  sourceNote: string | null;
  isOriginal: boolean;
  altText: string | null;
  hasImage: boolean;
};

export type ApiTable = {
  id: string;
  label: string;
  caption: string;
  sectionId: string | null;
  sourceNote: string | null;
  columns: string[];
  rows: string[][];
};

export type SourceEntry = {
  id: string;
  citeKey: string;
  number: number | null;
  citationCount: number;
  formatted: string;
  inTextCore: string;
};

export type NumberedItem = { id: string; label: string; number: number };

export type ReportIndex = {
  style: ReferenceStyle;
  citationWrap: { open: string; close: string; separator: string };
  sources: SourceEntry[];
  figures: NumberedItem[];
  tables: NumberedItem[];
};

export type Severity = "error" | "warning" | "info" | "ok";
export type CheckLink = { kind: "section"; id: string } | { kind: "document"; id: string } | { kind: "tool"; tool: "references" | "figures" | "tables" | "details" };
export type Check = { id: string; severity: Severity; title: string; detail: string; link?: CheckLink };

/* ---- Writing coach ---- */

export type CoachReview = {
  readiness: "needs_more" | "developing" | "nearly_there";
  overall: string;
  strengths: string[];
  gaps: { issue: string; quote: string; why: string; howToFix: string }[];
  questions: string[];
  style: string[];
};

export type CoachStatus = { enabled: boolean; dailyLimit: number; remaining: number };
