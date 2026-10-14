import test from "node:test";
import assert from "node:assert/strict";
import { buildSourceEntries, citationWrap, type IndexedSource } from "../../citations";
import { templates } from "../../templates";
import { runChecks, type CheckInput } from "./report.checks";
import { numberItems, type SectionInfo } from "./report.numbering";

const section = (order: number, number: string, templateKey: string | null, content = "", depth = 1): SectionInfo => ({
  id: `s${order}`, chapterId: "c", parentId: null, number, title: `Section ${number}`, templateKey, content, depth, order,
});
const source = (id: string, key: string): IndexedSource => ({ id, citeKey: key, type: "BOOK", authors: [{ given: "A.", family: key }], editors: [], title: `Book ${key}`, year: 2020, publisher: "P" });
const when = new Date("2026-01-01");

test("figures are numbered in report order, not creation order", () => {
  const sections = [section(0, "1.1", null), section(1, "2.1", null), section(2, "3.1", null)];
  const items = [
    { id: "late", label: "late", sectionId: "s2", position: 0, createdAt: when },
    { id: "early", label: "early", sectionId: "s0", position: 0, createdAt: new Date("2026-06-01") },
    { id: "loose", label: "loose", sectionId: null, position: 0, createdAt: when },
  ];
  assert.deepEqual(numberItems(items, sections).map((item) => [item.label, item.number]), [["early", 1], ["late", 2], ["loose", 3]]);
});

test("reordering sections renumbers figures", () => {
  const items = [{ id: "a", label: "a", sectionId: "s0", position: 0, createdAt: when }, { id: "b", label: "b", sectionId: "s1", position: 0, createdAt: when }];
  const before = numberItems(items, [section(0, "1.1", null), section(1, "2.1", null)]);
  const after = numberItems(items, [{ ...section(1, "1.1", null), id: "s1" }, { ...section(0, "2.1", null), id: "s0" }].map((s, i) => ({ ...s, order: i })));
  assert.equal(before.find((item) => item.label === "a")?.number, 1);
  assert.equal(after.find((item) => item.label === "a")?.number, 2);
});

function input(overrides: Partial<CheckInput> & { text?: Record<string, string> } = {}): CheckInput {
  const sources = overrides.sources ?? [source("1", "alpha"), source("2", "beta")];
  const sections = overrides.sections ?? [section(0, "2.3", "related-works", overrides.text?.s0 ?? "", 2)];
  const blocks = sections.map((s) => ({ id: s.id, kind: "section" as const, title: `${s.number} ${s.title}`, text: s.content }));
  const style = overrides.style ?? "IEEE";
  return {
    style, template: templates["eee-hnd-design"], documents: [], sections, blocks, sources, figures: [], tables: [],
    index: { style, citationWrap: citationWrap(style), sources: buildSourceEntries(style, sources, blocks), figures: [], tables: [] },
    ...overrides,
  };
}
const byId = (checks: ReturnType<typeof runChecks>, id: string) => checks.find((check) => check.id === id);

test("requires five related works to be cited in the related-works section", () => {
  const sources = ["a", "b", "c", "d", "e"].map((key, i) => source(String(i), key));
  const few = runChecks(input({ sources, sections: [section(0, "2.3", "related-works", "[@a; @b; @c]", 2)] }));
  assert.equal(byId(few, "related-works-min")?.severity, "warning");
  assert.match(byId(few, "related-works-min")!.title, /3 of 5/);
  const enough = runChecks(input({ sources, sections: [section(0, "2.3", "related-works", "[@a; @b; @c; @d; @e]", 2)] }));
  assert.equal(byId(enough, "related-works-min")?.severity, "ok");
});

test("flags unknown citation keys as errors and uncited sources as warnings", () => {
  const checks = runChecks(input({ sections: [section(0, "2.3", "related-works", "See [@alpha] and [@ghost].", 2)] }));
  assert.equal(byId(checks, "unknown-citations")?.severity, "error");
  assert.match(byId(checks, "unknown-citations")!.detail, /ghost/);
  assert.equal(byId(checks, "uncited-sources")?.severity, "warning");
  assert.match(byId(checks, "uncited-sources")!.title, /1 source is never cited/);
});

test("an imported figure needs a source, and headings stop at three levels", () => {
  const figures = [{ id: "f", label: "pic", caption: "Pic", sectionId: "s0", sourceNote: null, isOriginal: false, mimeType: "image/png" }];
  const checks = runChecks(input({ figures, sections: [section(0, "3.1.1.1", null, "text [fig:pic]", 3)] }));
  assert.equal(byId(checks, "figures-attribution")?.severity, "error");
  assert.equal(byId(checks, "heading-depth")?.severity, "error");
  assert.equal(byId(checks, "figures-unreferenced"), undefined);
});

test("flags a figure that the text never mentions", () => {
  const figures = [{ id: "f", label: "pic", caption: "Pic", sectionId: "s0", sourceNote: null, isOriginal: true, mimeType: "image/png" }];
  assert.equal(byId(runChecks(input({ figures, sections: [section(0, "3.1", null, "no mention", 2)] })), "figures-unreferenced")?.severity, "warning");
});

test("the abstract may not contain citations or figure references", () => {
  const documents = [{ id: "d", type: "ABSTRACT", title: "Abstract", content: "As shown in [fig:x] and [@alpha].", isEnabled: true }];
  assert.equal(byId(runChecks(input({ documents })), "abstract-markers")?.severity, "error");
});

test("errors sort before warnings, warnings before passes", () => {
  const checks = runChecks(input({ sections: [section(0, "2.3", "related-works", "[@ghost]", 2)] }));
  const rank = { error: 0, warning: 1, info: 2, ok: 3 } as const;
  const ranks = checks.map((check) => rank[check.severity]);
  assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b));
});

test("asks for the details that the cover and approval pages need", () => {
  const missing = runChecks({ ...input(), details: { studentName: "A", registrationNumber: null, supervisorNames: null, hodName: "B" } });
  assert.equal(byId(missing, "project-details")?.severity, "warning");
  assert.match(byId(missing, "project-details")!.detail, /registration number.*supervisor/);
  const complete = runChecks({ ...input(), details: { studentName: "A", registrationNumber: "R", supervisorNames: "S", hodName: "H" } });
  assert.equal(byId(complete, "project-details")?.severity, "ok");
});
