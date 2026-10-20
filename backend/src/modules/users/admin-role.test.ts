import test from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ||= "postgresql://x:x@localhost:5432/x";
process.env.ADMIN_EMAILS = " Owner@Example.com , second@example.com ";

const row = (email: string, role = "STUDENT") => ({ id: "1", firstName: "A", lastName: "B", email, role, isActive: true, experienceLevel: null, onboardedAt: null, createdAt: new Date(), updatedAt: new Date() });

test("emails in ADMIN_EMAILS are administrators, matched without regard to case or spaces", async () => {
  const { publicUser } = await import("./user.service");
  assert.equal(publicUser(row("owner@example.com")).role, "admin");
  assert.equal(publicUser(row("SECOND@example.com")).role, "admin");
  assert.equal(publicUser(row("student@example.com")).role, "student");
  assert.equal(publicUser(row("student@example.com", "ADMIN")).role, "admin", "a database admin stays an admin");
});
