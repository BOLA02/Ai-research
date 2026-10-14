export type SectionInfo = {
  id: string;
  chapterId: string;
  parentId: string | null;
  number: string;
  title: string;
  templateKey: string | null;
  content: string;
  depth: number;
  order: number;
};


type Placeable = { id: string; label: string; sectionId: string | null; position: number; createdAt: Date };

/**
 * Numbers figures or tables 1, 2, 3 in the order they appear in the report. Items not yet placed in
 * a section come last. The numbers change by themselves when chapters or sections are reordered.
 */
export function numberItems<T extends Placeable>(items: T[], sections: SectionInfo[]) {
  const order = new Map(sections.map((section) => [section.id, section.order]));
  const sorted = [...items].sort((a, b) => {
    const left = a.sectionId && order.has(a.sectionId) ? order.get(a.sectionId)! : Infinity;
    const right = b.sectionId && order.has(b.sectionId) ? order.get(b.sectionId)! : Infinity;
    return left - right || a.position - b.position || a.createdAt.getTime() - b.createdAt.getTime();
  });
  return sorted.map((item, index) => ({ id: item.id, label: item.label, number: index + 1 }));
}
