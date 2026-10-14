import test from "node:test";
import assert from "node:assert/strict";
import { projectCreateSchema, projectUpdateSchema } from "./project.validation";

test("an update names only the fields it changes", () => {
  const parsed = projectUpdateSchema.parse({ studentName: "Musa Ibrahim" });
  assert.deepEqual(Object.keys(parsed), ["studentName"]);
  assert.equal("referenceStyle" in parsed, false);
  assert.equal("department" in parsed, false);
});

test("an update can switch the style on its own", () => {
  assert.deepEqual(projectUpdateSchema.parse({ referenceStyle: "APA" }), { referenceStyle: "APA" });
});

test("an update can clear a detail with an empty string", () => {
  assert.equal(projectUpdateSchema.parse({ hodName: "" }).hodName, null);
});

test("an empty update and unknown styles are rejected", () => {
  assert.equal(projectUpdateSchema.safeParse({}).success, false);
  assert.equal(projectUpdateSchema.safeParse({ referenceStyle: "Chicago" }).success, false);
  assert.equal(projectUpdateSchema.safeParse({ templateId: "eee-hnd-design" }).success, false);
});

test("creating still fills in defaults", () => {
  const parsed = projectCreateSchema.parse({ title: "T" });
  assert.equal(parsed.referenceStyle, "IEEE");
  assert.equal(parsed.department, "");
});
