import type { ApiChapter, ApiDocument, ApiSection, Guidance, Template, TemplateSection } from "./types";

export type SectionNode = ApiSection & { number: string; children: SectionNode[] };

export function buildSectionTree(chapter: ApiChapter): SectionNode[] {
  const byParent = new Map<string | null, ApiSection[]>();
  for (const section of chapter.sections) {
    const list = byParent.get(section.parentSectionId) ?? [];
    list.push(section);
    byParent.set(section.parentSectionId, list);
  }
  const walk = (parent: string | null, prefix: string): SectionNode[] =>
    (byParent.get(parent) ?? [])
      .sort((a, b) => a.position - b.position)
      .map((section, index) => {
        const number = `${prefix}.${index + 1}`;
        return { ...section, number, children: walk(section.id, number) };
      });
  return walk(null, String(chapter.number));
}

export function flattenTree(nodes: SectionNode[]): SectionNode[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children)]);
}

export const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

/**
 * Whether the student has really started a part. Declaration and approval pages arrive
 * pre-filled with blanks (______), which should not count as progress.
 */
export const isStarted = (text: string) => wordCount(text) > 0 && !/_{5,}/.test(text);

export type WritingItem =
  | { kind: "document"; id: string; title: string; content: string; href: string }
  | { kind: "section"; id: string; title: string; content: string; href: string; chapterId: string };

/** Everything the student actually types into, in report order. */
export function writingItems(
  projectId: string,
  documents: ApiDocument[],
  chapters: ApiChapter[],
  template: Template | null,
): WritingItem[] {
  const generated = new Set(template?.documents.filter((doc) => doc.generated).map((doc) => doc.type));
  const docs: WritingItem[] = documents
    .filter((doc) => doc.isEnabled && !generated.has(doc.type))
    .map((doc) => ({
      kind: "document",
      id: doc.id,
      title: doc.title,
      content: doc.content,
      href: `/projects/${projectId}/page/${doc.id}`,
    }));
  const sections: WritingItem[] = chapters.flatMap((chapter) =>
    flattenTree(buildSectionTree(chapter)).map((section) => ({
      kind: "section" as const,
      id: section.id,
      title: `${section.number} ${section.title}`,
      content: section.content,
      chapterId: chapter.id,
      href: `/projects/${projectId}/section/${section.id}`,
    })),
  );
  return [...docs, ...sections];
}

const GENERIC_SECTION: Guidance = {
  purpose: "This is a section you added yourself. Keep it focused on one idea.",
  prompts: ["What is the one point this section should make?"],
  tips: ["Cite every source with Insert › Citation, so it follows your reference style."],
};

function findTemplateSection(sections: TemplateSection[], key: string): TemplateSection | undefined {
  for (const section of sections) {
    if (section.key === key) return section;
    const inner = findTemplateSection(section.children ?? [], key);
    if (inner) return inner;
  }
}

export function sectionGuidance(template: Template | null, key: string | null) {
  if (template && key)
    for (const chapter of template.chapters) {
      const hit = findTemplateSection(chapter.sections, key);
      if (hit) return { guidance: hit.guidance, optional: !!hit.optional, custom: false };
    }
  return { guidance: GENERIC_SECTION, optional: false, custom: true };
}

export function documentGuidance(template: Template | null, type: string) {
  return template?.documents.find((doc) => doc.type === type);
}

export function chapterTemplate(template: Template | null, key: string | null) {
  return template?.chapters.find((chapter) => chapter.key === key);
}
