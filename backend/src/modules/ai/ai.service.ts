import { env } from "../../config/env";
import { findMarkers, resolveText } from "../../citations";
import { AppError } from "../../shared/errors";
import { DEFAULT_TEMPLATE_ID, getTemplate, type SectionTemplate } from "../../templates";
import { recordActivity } from "../activity";
import { loadReportContext } from "../report/report.context";
import { buildIndex } from "../report/report.service";
import { AiRefusedError, AiUnavailableError, aiEnabled, anthropicReviewClient, type ReviewClient } from "./ai.client";
import { MAX_WORDS, MIN_WORDS, buildUserMessage, cleanReview, wordCount } from "./ai.prompt";
import type { Review } from "./ai.schema";
import { release, reserve, usedToday } from "./ai.usage";

/** Sections that should be read against the objectives the student set in Chapter 1. */
const OBJECTIVE_AWARE = new Set(["testing-introduction", "discussions", "testing-conclusion", "conclusion", "recommendation"]);
const REVIEWABLE_DOCUMENTS = new Set(["ABSTRACT"]);

export async function status(userId: string) {
  const used = aiEnabled() ? await usedToday(userId) : 0;
  return { enabled: aiEnabled(), dailyLimit: env.AI_DAILY_LIMIT, remaining: Math.max(0, env.AI_DAILY_LIMIT - used) };
}

function findTemplateSection(sections: SectionTemplate[], key: string): SectionTemplate | undefined {
  for (const section of sections) {
    if (section.key === key) return section;
    const inner = findTemplateSection(section.children ?? [], key);
    if (inner) return inner;
  }
}

export async function reviewText(userId: string, projectId: string, request: { kind: "section" | "document"; id: string }, client: ReviewClient = anthropicReviewClient) {
  if (!aiEnabled()) throw new AppError(503, "AI_NOT_CONFIGURED", "The writing coach is not set up on this server");

  const context = await loadReportContext(userId, projectId);
  const { project } = context;
  const template = getTemplate(project.templateId ?? DEFAULT_TEMPLATE_ID) ?? getTemplate(DEFAULT_TEMPLATE_ID)!;
  const index = buildIndex(context);

  let raw: string;
  let location: string;
  let key: string | null;
  let guidance: { purpose: string; prompts: string[]; tips?: string[] } | null = null;
  let requirement: string | null = null;
  let distinct: number | null = null;

  if (request.kind === "section") {
    const section = context.sections.find((row) => row.id === request.id);
    if (!section) throw new AppError(404, "SECTION_NOT_FOUND", "Section not found");
    const chapter = context.chapters.find((row) => row.id === section.chapterId)!;
    raw = section.content;
    key = section.templateKey;
    location = `Chapter ${chapter.number}: ${chapter.title}, section ${section.number} ${section.title}`;
    const found = key ? template.chapters.map((c) => findTemplateSection(c.sections, key!)).find(Boolean) : undefined;
    guidance = found?.guidance ?? null;
    const rule = template.requirements.find((item) => item.sectionKey === key);
    if (rule) {
      requirement = rule.message;
      const cited = new Set<string>();
      for (const marker of findMarkers(raw)) if (marker.kind === "cite") for (const item of marker.items) cited.add(item.key);
      distinct = cited.size;
    }
  } else {
    const doc = context.documents.find((row) => row.id === request.id);
    if (!doc) throw new AppError(404, "DOCUMENT_NOT_FOUND", "Page not found");
    if (!REVIEWABLE_DOCUMENTS.has(doc.type)) throw new AppError(400, "NOT_REVIEWABLE", "The writing coach reviews the abstract and the chapter sections");
    raw = doc.content;
    key = doc.type;
    location = `Front matter: ${doc.title}`;
    guidance = template.documents.find((row) => row.type === doc.type)?.guidance ?? null;
  }

  raw = raw.replace(/^\{(?:left|right|center|justify)\}[ \t]?/gm, "");
  const words = wordCount(raw);
  if (words < MIN_WORDS) throw new AppError(400, "TEXT_TOO_SHORT", `Write at least ${MIN_WORDS} words first, then ask for feedback. The questions beside the editor can help you start.`);
  if (words > MAX_WORDS) throw new AppError(400, "TEXT_TOO_LONG", `This part is over ${MAX_WORDS} words. Review one section at a time.`);

  const text = resolveText(raw, index);
  const objectivesSection = key && OBJECTIVE_AWARE.has(key) ? context.sections.find((row) => row.templateKey === "aim-objectives") : undefined;

  const message = buildUserMessage({
    template,
    projectTitle: project.title,
    projectType: template.projectType === "MAINTENANCE" ? "Maintenance and repair" : "Design and construction",
    referenceStyle: index.style,
    location,
    key,
    guidance,
    requirement,
    distinctSourcesCited: distinct,
    objectives: key && OBJECTIVE_AWARE.has(key) ? (objectivesSection ? resolveText(objectivesSection.content, index) : "") : null,
    text,
  });

  if (!(await reserve(userId, env.AI_DAILY_LIMIT))) throw new AppError(429, "AI_LIMIT_REACHED", `You have used all ${env.AI_DAILY_LIMIT} reviews for today. They reset at midnight UTC.`);

  let review: Review;
  try {
    review = cleanReview(await client.review(message), text);
  } catch (error) {
    await release(userId);
    if (error instanceof AiRefusedError) throw new AppError(422, "AI_DECLINED", "The writing coach couldn't review this text. Try again with a different section, or ask your supervisor.");
    if (error instanceof AiUnavailableError) throw new AppError(503, "AI_UNAVAILABLE", "The writing coach isn't available right now. Please try again in a few minutes.");
    throw error;
  }
  recordActivity({ type: "ai_review", userId, projectId, meta: { kind: request.kind } });
  return { review, ...(await status(userId)) };
}
