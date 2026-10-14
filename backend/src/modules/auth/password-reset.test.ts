import test from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ||= "postgresql://x:x@localhost:5432/x";

test("reset schema needs matching passwords of at least 8 characters", async () => {
  const { resetPasswordSchema, forgotPasswordSchema } = await import("./auth.validation");
  const token = "a".repeat(43);
  assert.ok(resetPasswordSchema.safeParse({ token, password: "longenough1", confirmPassword: "longenough1" }).success);
  assert.ok(!resetPasswordSchema.safeParse({ token, password: "short", confirmPassword: "short" }).success);
  assert.ok(!resetPasswordSchema.safeParse({ token, password: "longenough1", confirmPassword: "different11" }).success);
  assert.ok(!resetPasswordSchema.safeParse({ token: "x", password: "longenough1", confirmPassword: "longenough1" }).success);
  assert.ok(!resetPasswordSchema.safeParse({ token, password: "longenough1", confirmPassword: "longenough1", role: "ADMIN" }).success);
  assert.equal(forgotPasswordSchema.parse({ email: "  Ada@Example.COM " }).email, "ada@example.com");
});

test("the reset email carries the link and strips markup from the name", async () => {
  const { resetEmail } = await import("./reset-email");
  const mail = resetEmail("<b>Ada</b>", "https://x.test/reset-password?token=abc", 60);
  assert.ok(mail.text.includes("https://x.test/reset-password?token=abc"));
  assert.ok(mail.text.includes("60 minutes"));
  assert.ok(!mail.html.includes("<b>"));
});
