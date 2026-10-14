import { eeeHndDesign, eeeHndMaintenance } from "./eee-hnd";
import type { ReportTemplate } from "./types";

export * from "./types";

export const templates: Record<string, ReportTemplate> = {
  [eeeHndDesign.id]: eeeHndDesign,
  [eeeHndMaintenance.id]: eeeHndMaintenance,
};

export const DEFAULT_TEMPLATE_ID = eeeHndDesign.id;
export const TEMPLATE_IDS = Object.keys(templates) as [string, ...string[]];

export function getTemplate(id: string) {
  return templates[id];
}

/** Older clients send only a free-text project type such as "Design & Construction". */
export function resolveTemplateId(templateId: string | undefined, projectType: string | undefined) {
  if (templateId) return templateId;
  return /maint|repair/i.test(projectType || "") ? eeeHndMaintenance.id : DEFAULT_TEMPLATE_ID;
}

export function fillPlaceholders(text: string, values: { title: string }) {
  return text.split("{{title}}").join(values.title.toUpperCase());
}
