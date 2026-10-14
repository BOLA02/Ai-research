import { buildSourceEntries, citationWrap, normaliseStyle, resolveText, type ReportIndex } from "../../citations";
import { DEFAULT_TEMPLATE_ID, getTemplate } from "../../templates";
import { loadReportContext, type ReportContext } from "./report.context";
import { numberItems } from "./report.numbering";
import { runChecks } from "./report.checks";

export function buildIndex(context: ReportContext): ReportIndex {
  const style = normaliseStyle(context.project.referenceStyle);
  return {
    style,
    citationWrap: citationWrap(style),
    sources: buildSourceEntries(style, context.sources, context.blocks),
    figures: numberItems(context.figures, context.sections),
    tables: numberItems(context.tables, context.sections),
  };
}

export async function getIndex(userId: string, projectId: string) {
  return buildIndex(await loadReportContext(userId, projectId));
}

export async function resolve(userId: string, projectId: string, text: string) {
  return resolveText(text, await getIndex(userId, projectId));
}

export async function getChecks(userId: string, projectId: string) {
  const context = await loadReportContext(userId, projectId);
  const index = buildIndex(context);
  const template = getTemplate(context.project.templateId ?? DEFAULT_TEMPLATE_ID);
  const checks = runChecks({
    style: index.style,
    template,
    details: context.project,
    documents: context.documents,
    sections: context.sections,
    blocks: context.blocks,
    sources: context.sources,
    figures: context.figures,
    tables: context.tables,
    index,
  });
  return { checks, counts: { error: checks.filter((c) => c.severity === "error").length, warning: checks.filter((c) => c.severity === "warning").length, info: checks.filter((c) => c.severity === "info").length, ok: checks.filter((c) => c.severity === "ok").length } };
}
