import test from "node:test";
import assert from "node:assert/strict";
import { labelFrom, uniqueLabel } from "./labels";

test("labels skip filler words and stay short", () => {
  assert.equal(labelFrom("Block diagram of the system"), "block-diagram-system");
  assert.equal(labelFrom("Design specification"), "design-specification");
  assert.equal(labelFrom("The of"), "the-of");
  assert.equal(labelFrom("???"), "item");
});

test("a taken label gets a number", () => {
  assert.equal(uniqueLabel("Results", new Set(["results"])), "results-2");
  assert.equal(uniqueLabel("Results", new Set(["results", "results-2"])), "results-3");
});
