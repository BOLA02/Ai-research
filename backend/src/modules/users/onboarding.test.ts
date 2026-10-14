import test from "node:test";
import assert from "node:assert/strict";
import { scoreReadiness } from "./onboarding";
import { onboardingSchema } from "./user.validation";

test("someone new to reports is a beginner", () => assert.equal(scoreReadiness([0, 0, 0]), "beginner"));
test("a little of everything is intermediate", () => assert.equal(scoreReadiness([1, 1, 1]), "intermediate"));
test("experienced on all three is confident", () => assert.equal(scoreReadiness([2, 2, 1]), "confident"));
test("the boundary of beginner is a total of two", () => assert.equal(scoreReadiness([1, 1, 0]), "beginner"));

test("onboarding accepts three answers from 0 to 2, or none (skip)", () => {
  assert.ok(onboardingSchema.safeParse({}).success);
  assert.ok(onboardingSchema.safeParse({ answers: [0, 1, 2] }).success);
  assert.equal(onboardingSchema.safeParse({ answers: [0, 1, 3] }).success, false);
  assert.equal(onboardingSchema.safeParse({ answers: [0, 1] }).success, false);
});

test("publicUser never exposes the password hash", async () => {
  const { publicUser } = await import("./user.service");
  const now = new Date();
  const result = publicUser({
    id: "1", firstName: "A", lastName: "B", email: "a@b.c", role: "STUDENT", isActive: true,
    experienceLevel: null, onboardedAt: null, createdAt: now, updatedAt: now,
    passwordHash: "secret-hash",
  } as Parameters<typeof publicUser>[0]);
  assert.equal("passwordHash" in result, false);
  assert.equal(JSON.stringify(result).includes("secret-hash"), false);
});
