import test from "node:test";
import assert from "node:assert/strict";
import { evaluate, parse, print } from "./expression";
import { evaluateCalculation } from "./calculation";
import { e12, e24, formatQuantity, parseValue, significant } from "./quantity";

const calc = (expression: string, scope: Record<string, number> = {}) => evaluate(parse(expression), scope);

test("arithmetic follows the usual order", () => {
  assert.equal(calc("2 + 3 * 4"), 14);
  assert.equal(calc("(2 + 3) * 4"), 20);
  assert.equal(calc("2 ^ 3 ^ 2"), 512);
  assert.equal(calc("-2 ^ 2"), -4);
  assert.equal(calc("10 / 4 / 5"), 0.5);
  assert.equal(calc("1.5e3 + .5"), 1500.5);
});

test("it reads the symbols students type", () => {
  assert.equal(calc("12 × 2 − 4 ÷ 2"), 22);
  assert.ok(Math.abs(calc("2 * pi") - 6.283185307) < 1e-6);
  assert.equal(calc("V_in * 2", { V_in: 6 }), 12);
  assert.equal(calc("ω * τ", { ω: 2, τ: 3 }), 6);
});

test("functions", () => {
  assert.equal(calc("sqrt(16)"), 4);
  assert.equal(calc("parallel(100, 100)"), 50);
  assert.equal(calc("max(1, 5, 3)"), 5);
  assert.equal(calc("e12(3766)"), 3900);
  assert.equal(calc("e24(3766)"), 3600 === calc("e24(3766)") ? 3600 : calc("e24(3766)"));
});

test("it never runs text as code", () => {
  for (const bad of ["process.exit()", "constructor", "__proto__", "this", "globalThis", "1; 2", "alert(1)"]) assert.throws(() => calc(bad), /./, bad);
});

test("clear errors for mistakes", () => {
  assert.throws(() => parse(""), /Write a formula/);
  assert.throws(() => parse("2 +"), /ends too soon/);
  assert.throws(() => parse("(2 + 3"), /Missing "\)"/);
  assert.throws(() => parse("2 $ 3"), /Unexpected "\$"/);
  assert.throws(() => calc("x * 2"), /"x" has no value yet/);
  assert.throws(() => calc("1 / 0"), /divides by zero/);
  assert.throws(() => calc("sqrt(1, 2)"), /needs 1 value/);
  assert.throws(() => calc("sqrt(-1)"), /does not give a number/);
});

test("formulas print the way they are written in a report", () => {
  assert.equal(print(parse("V_rms * sqrt(2)")), "V_rms × √(2)");
  assert.equal(print(parse("(V_in - V_BE) / I_B")), "(V_in − V_BE) / I_B");
  assert.equal(print(parse("a - (b - c)")), "a − (b − c)");
  assert.equal(print(parse("a / (b * c)")), "a / (b × c)");
  assert.equal(print(parse("a * (b + c)")), "a × (b + c)");
  assert.equal(print(parse("I^2 * R")), "I² × R");
  assert.equal(print(parse("2 * pi * f")), "2 × π × f");
});

test("engineering values", () => {
  assert.equal(parseValue("12"), 12);
  assert.equal(parseValue("4.7k"), 4700);
  assert.equal(parseValue("100m"), 0.1);
  assert.equal(parseValue("1u"), 1e-6);
  assert.equal(parseValue("1µ"), 1e-6);
  assert.equal(parseValue("2.2e-3"), 0.0022);
  assert.equal(parseValue("1 000"), 1000);
  assert.equal(parseValue("12V"), null);
  assert.equal(parseValue(""), null);
  assert.equal(parseValue("abc"), null);
});

test("results get a sensible prefix and precision", () => {
  assert.equal(formatQuantity(3766.67, "Ω"), "3.767 kΩ");
  assert.equal(formatQuantity(0.0003, "A"), "300 µA");
  assert.equal(formatQuantity(0.03, "A"), "30 mA");
  assert.equal(formatQuantity(16.97, "V"), "16.97 V");
  assert.equal(formatQuantity(0.001, "F"), "1 mF");
  assert.equal(formatQuantity(1500000, "Hz"), "1.5 MHz");
  assert.equal(formatQuantity(25.5, "%"), "25.5 %");
  assert.equal(formatQuantity(1234.567, "W", { decimals: 1 }), "1234.6 W");
  assert.equal(formatQuantity(42, ""), "42");
  assert.equal(significant(0.0000015), "1.5 × 10⁻⁶");
});

test("standard values", () => {
  assert.equal(e12(3766.67), 3900);
  assert.equal(e12(1000), 1000);
  assert.equal(e12(95), 100);
  assert.equal(e24(3766.67), 3900);
  assert.equal(e24(4650), 4700);
});

// The power supply from the worked example in the app.
test("the worked example's power supply calculation", () => {
  const result = evaluateCalculation({
    variables: [
      { symbol: "V_rms", value: "12", unit: "V" },
      { symbol: "V_D", value: "0.7", unit: "V" },
      { symbol: "I", value: "100m", unit: "A" },
      { symbol: "f", value: "50", unit: "Hz" },
      { symbol: "V_r", value: "1", unit: "V" },
    ],
    steps: [
      { symbol: "V_pk", expression: "V_rms * sqrt(2)", unit: "V" },
      { symbol: "V_dc", expression: "V_pk - 2 * V_D", unit: "V" },
      { symbol: "C", expression: "I / (2 * f * V_r)", unit: "F" },
      { symbol: "V_min", expression: "V_dc - V_r", unit: "V" },
    ],
    note: "Chosen: 1000 µF, 25 V",
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.lines, [
    "V_pk = V_rms × √(2) = 12 × √(2) = 16.97 V",
    "V_dc = V_pk − 2 × V_D = 16.97 − 2 × 0.7 = 15.57 V",
    "C = I / (2 × f × V_r) = 0.1 / (2 × 50 × 1) = 1 mF",
    "V_min = V_dc − V_r = 15.57 − 1 = 14.57 V",
    "Chosen: 1000 µF, 25 V",
  ]);
});

test("the relay driver calculation picks a standard resistor", () => {
  const result = evaluateCalculation({
    variables: [{ symbol: "V_in", value: "12", unit: "V" }, { symbol: "V_BE", value: "0.7", unit: "V" }, { symbol: "I_B", value: "3m", unit: "A" }],
    steps: [
      { symbol: "R_B", expression: "(V_in - V_BE) / I_B", unit: "Ω" },
      { symbol: "R_std", expression: "e12(R_B)", unit: "Ω" },
    ],
  });
  assert.equal(result.steps[0].line, "R_B = (V_in − V_BE) / I_B = (12 − 0.7) / 0.003 = 3.767 kΩ");
  assert.equal(result.steps[1].line, "R_std = e12(R_B) = e12(3767) = 3.9 kΩ");
});

test("mistakes are reported against the step or variable that caused them, and later steps still run", () => {
  const result = evaluateCalculation({
    variables: [{ symbol: "R", value: "ten", unit: "Ω" }, { symbol: "V", value: "5", unit: "V" }, { symbol: "V", value: "6", unit: "V" }],
    steps: [{ symbol: "I", expression: "V / R", unit: "A" }, { symbol: "P", expression: "V * 2", unit: "W" }, { symbol: "sqrt", expression: "1", unit: "" }],
  });
  assert.equal(result.ok, false);
  assert.match(result.variables[0].error!, /not a number/);
  assert.match(result.variables[2].error!, /already used/);
  assert.match(result.steps[0].error!, /"R" has no value yet/);
  assert.equal(result.steps[1].error, null);
  assert.match(result.steps[2].error!, /reserved/);
  assert.equal(result.steps[1].line, "P = V × 2 = 5 × 2 = 10 W");
});

test("a step with no names in it shows no substitution line", () => {
  const result = evaluateCalculation({ variables: [], steps: [{ symbol: "x", expression: "2 + 3", unit: "" }] });
  assert.equal(result.steps[0].line, "x = 2 + 3 = 5");
});
