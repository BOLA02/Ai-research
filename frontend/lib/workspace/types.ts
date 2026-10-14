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
    marginsMm: { left: number; top: number; right: number; bottom: number };
    minPages: number;
    maxPages: number;
  };
};

export type TemplateSummary = Pick<
  Template,
  "id" | "name" | "institution" | "department" | "programme" | "projectType"
>;
