import test from "node:test";
import assert from "node:assert/strict";
import { fillPlaceholders, resolveTemplateId, templates, type SectionTemplate } from "./index";

const flatten = (sections: SectionTemplate[]): SectionTemplate[] =>
  sections.flatMap((item) => [item, ...flatten(item.children || [])]);

const depth = (sections: SectionTemplate[]): number =>
  Math.max(0, ...sections.map((item) => 1 + depth(item.children || [])));

test("EEE design template has the six chapters from the department slides", () => {
  const chapters = templates["eee-hnd-design"].chapters;
  assert.deepEqual(
    chapters.map((chapter) => chapter.title),
    [
      "Introduction",
      "Literature Review",
      "Design Methodology",
      "Construction and Packaging",
      "Testing and Result",
      "Conclusions and Recommendations",
    ],
  );
});

test("maintenance chapters 1 to 3 follow the slides and 4 to 6 are student-defined", () => {
  const maintenance = templates["eee-hnd-maintenance"].chapters;
  assert.equal(maintenance.length, 6);
  assert.equal(maintenance[2].title, "Trouble Shooting and Remedy");
  assert.deepEqual(maintenance.map((chapter) => !!chapter.studentDefined), [false, false, false, true, true, true]);
  assert.ok(maintenance.slice(3).every((chapter) => chapter.sections.length === 0));
});

test("chapter numbers are sequential and keys are unique per chapter", () => {
  for (const template of Object.values(templates)) {
    template.chapters.forEach((chapter, index) => {
      assert.equal(chapter.number, index + 1);
      const keys = flatten(chapter.sections).map((item) => item.key);
      assert.equal(new Set(keys).size, keys.length, `${template.id} ch${chapter.number}`);
    });
  }
});

test("sections never nest beyond the three levels the guidelines allow", () => {
  for (const template of Object.values(templates))
    for (const chapter of template.chapters)
      assert.ok(depth(chapter.sections) + 1 <= template.format.maxHeadingDepth, chapter.title);
});

test("every section has guidance text", () => {
  for (const template of Object.values(templates))
    for (const chapter of template.chapters)
      for (const item of flatten(chapter.sections))
        assert.ok(item.guidance.purpose.length > 0, `${template.id} ${item.key}`);
});

test("preliminary pages follow the guideline order and numbering", () => {
  const docs = templates["eee-hnd-design"].documents;
  assert.equal(docs[0].type, "COVER_PAGE");
  assert.equal(docs.at(-1)?.type, "ABSTRACT");
  assert.equal(docs[0].numbering, "none");
  assert.equal(docs.find((doc) => doc.type === "TITLE_PAGE")?.numbering, "none");
  assert.equal(docs.find((doc) => doc.type === "ABSTRACT")?.numbering, "roman");
});

test("requires at least five related works", () => {
  const rule = templates["eee-hnd-design"].requirements.find((item) => item.sectionKey === "related-works");
  assert.equal(rule?.minItems, 5);
});

test("resolveTemplateId falls back on the free-text project type", () => {
  assert.equal(resolveTemplateId(undefined, "Design & Construction"), "eee-hnd-design");
  assert.equal(resolveTemplateId(undefined, "Repair and Maintenance"), "eee-hnd-maintenance");
  assert.equal(resolveTemplateId("eee-hnd-design", "Maintenance"), "eee-hnd-design");
});

test("fillPlaceholders inserts the upper-case title", () => {
  assert.equal(fillPlaceholders('"{{title}}"', { title: "Power supply" }), '"POWER SUPPLY"');
});
