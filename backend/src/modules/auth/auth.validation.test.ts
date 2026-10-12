import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, signupSchema } from "./auth.validation";
test("login normalizes email", () =>
  assert.equal(
    loginSchema.parse({ email: " Student@Example.COM ", password: "secret" })
      .email,
    "student@example.com",
  ));
test("signup validates matching passwords", () =>
  assert.equal(
    signupSchema.safeParse({
      firstName: "A",
      lastName: "Student",
      email: "a@example.com",
      password: "password1",
      confirmPassword: "password2",
    }).success,
    false,
  ));
test("signup strips role attempts", () =>
  assert.equal(
    signupSchema.safeParse({
      firstName: "A",
      lastName: "Student",
      email: "a@example.com",
      password: "password1",
      confirmPassword: "password1",
      role: "ADMIN",
    }).success,
    false,
  ));
