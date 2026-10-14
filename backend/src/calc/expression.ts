import { significant, superscript, e12, e24 } from "./quantity";

/** A small, safe calculator for formulas. It reads text into a tree and never runs the text as code. */

export type Node =
  | { t: "num"; value: number; text: string }
  | { t: "id"; name: string }
  | { t: "neg"; arg: Node }
  | { t: "bin"; op: "+" | "-" | "*" | "/" | "^"; left: Node; right: Node }
  | { t: "call"; name: string; args: Node[] };

export class CalcError extends Error {}

type Token = { kind: "num" | "id" | "op" | "end"; text: string; at: number };

const MAX_LENGTH = 300;

function tokenize(source: string): Token[] {
  const text = source.replace(/×|·|⋅/g, "*").replace(/÷/g, "/").replace(/−|–/g, "-");
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (/\s/.test(char)) { i += 1; continue; }
    const number = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(text.slice(i));
    if (number) { tokens.push({ kind: "num", text: number[0], at: i }); i += number[0].length; continue; }
    const id = /^[\p{L}][\p{L}\p{N}_]*/u.exec(text.slice(i));
    if (id) { tokens.push({ kind: "id", text: id[0], at: i }); i += id[0].length; continue; }
    if ("+-*/^(),".includes(char)) { tokens.push({ kind: "op", text: char, at: i }); i += 1; continue; }
    throw new CalcError(`Unexpected "${char}" at position ${i + 1}`);
  }
  tokens.push({ kind: "end", text: "", at: text.length });
  return tokens;
}

export function parse(source: string): Node {
  if (!source.trim()) throw new CalcError("Write a formula");
  if (source.length > MAX_LENGTH) throw new CalcError(`Keep the formula under ${MAX_LENGTH} characters`);
  const tokens = tokenize(source);
  let pos = 0;
  const peek = () => tokens[pos];
  const take = () => tokens[pos++];
  const isOp = (text: string) => peek().kind === "op" && peek().text === text;
  const expect = (text: string) => {
    if (!isOp(text)) throw new CalcError(peek().kind === "end" ? `Missing "${text}" at the end` : `Expected "${text}" at position ${peek().at + 1}`);
    take();
  };

  function expression(): Node {
    let left = term();
    while (isOp("+") || isOp("-")) left = { t: "bin", op: take().text as "+" | "-", left, right: term() };
    return left;
  }
  function term(): Node {
    let left = unary();
    while (isOp("*") || isOp("/")) left = { t: "bin", op: take().text as "*" | "/", left, right: unary() };
    return left;
  }
  function unary(): Node {
    if (isOp("-")) { take(); return { t: "neg", arg: unary() }; }
    if (isOp("+")) { take(); return unary(); }
    return power();
  }
  function power(): Node {
    const base = primary();
    if (isOp("^")) { take(); return { t: "bin", op: "^", left: base, right: unary() }; }
    return base;
  }
  function primary(): Node {
    const token = take();
    if (token.kind === "num") return { t: "num", value: Number(token.text), text: token.text };
    if (token.kind === "id") {
      if (isOp("(")) {
        take();
        const args: Node[] = [];
        if (!isOp(")")) do args.push(expression()); while (isOp(",") && take());
        expect(")");
        return { t: "call", name: token.text, args };
      }
      return { t: "id", name: token.text };
    }
    if (token.kind === "op" && token.text === "(") {
      const inner = expression();
      expect(")");
      return inner;
    }
    throw new CalcError(token.kind === "end" ? "The formula ends too soon" : `Unexpected "${token.text}" at position ${token.at + 1}`);
  }

  const tree = expression();
  if (peek().kind !== "end") throw new CalcError(`Unexpected "${peek().text}" at position ${peek().at + 1}`);
  return tree;
}

/* ------------------------------------------------------------ evaluation */

type Fn = { arity: number | "many"; run: (...args: number[]) => number };

export const FUNCTIONS: Record<string, Fn> = {
  sqrt: { arity: 1, run: Math.sqrt },
  abs: { arity: 1, run: Math.abs },
  exp: { arity: 1, run: Math.exp },
  ln: { arity: 1, run: Math.log },
  log10: { arity: 1, run: Math.log10 },
  sin: { arity: 1, run: Math.sin },
  cos: { arity: 1, run: Math.cos },
  tan: { arity: 1, run: Math.tan },
  asin: { arity: 1, run: Math.asin },
  acos: { arity: 1, run: Math.acos },
  atan: { arity: 1, run: Math.atan },
  pow: { arity: 2, run: Math.pow },
  min: { arity: "many", run: Math.min },
  max: { arity: "many", run: Math.max },
  round: { arity: 1, run: Math.round },
  ceil: { arity: 1, run: Math.ceil },
  floor: { arity: 1, run: Math.floor },
  /** Resistors, or any quantity that combines like resistors in parallel. */
  parallel: { arity: "many", run: (...values: number[]) => 1 / values.reduce((sum, value) => sum + 1 / value, 0) },
  e12: { arity: 1, run: e12 },
  e24: { arity: 1, run: e24 },
};

export const CONSTANTS: Record<string, number> = { pi: Math.PI, π: Math.PI, e: Math.E };
export const RESERVED = new Set([...Object.keys(FUNCTIONS), ...Object.keys(CONSTANTS)]);

/** Own properties only, so a name such as "constructor" or "__proto__" is never found on the prototype. */
export const own = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);

export function evaluate(node: Node, scope: Record<string, number>): number {
  switch (node.t) {
    case "num": return node.value;
    case "id": {
      if (own(scope, node.name)) return scope[node.name];
      if (own(CONSTANTS, node.name)) return CONSTANTS[node.name];
      throw new CalcError(`"${node.name}" has no value yet. Add it as a variable, or calculate it in an earlier step`);
    }
    case "neg": return -evaluate(node.arg, scope);
    case "bin": {
      const left = evaluate(node.left, scope);
      const right = evaluate(node.right, scope);
      if (node.op === "/" && right === 0) throw new CalcError("This divides by zero");
      const value = node.op === "+" ? left + right : node.op === "-" ? left - right : node.op === "*" ? left * right : node.op === "/" ? left / right : left ** right;
      if (!Number.isFinite(value)) throw new CalcError("This does not give a number");
      return value;
    }
    case "call": {
      const fn = own(FUNCTIONS, node.name) ? FUNCTIONS[node.name] : undefined;
      if (!fn) throw new CalcError(`"${node.name}" is not a function this calculator knows`);
      if (fn.arity !== "many" && node.args.length !== fn.arity) throw new CalcError(`${node.name} needs ${fn.arity} value${fn.arity === 1 ? "" : "s"}`);
      if (fn.arity === "many" && node.args.length < 1) throw new CalcError(`${node.name} needs at least one value`);
      const value = fn.run(...node.args.map((arg) => evaluate(arg, scope)));
      if (!Number.isFinite(value)) throw new CalcError(`${node.name} does not give a number for these values`);
      return value;
    }
  }
}

/* -------------------------------------------------------------- printing */

const PRECEDENCE = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 4 } as const;
const precedenceOf = (node: Node) => (node.t === "bin" ? PRECEDENCE[node.op] : node.t === "neg" ? 3 : 5);

/** Prints a formula the way it is written in a report. `value` supplies a number for a name, or null to keep the name. */
export function print(node: Node, value: (name: string) => string | null = () => null): string {
  const wrap = (child: Node, parent: number, allowEqual = true) => {
    const text = print(child, value);
    const own = precedenceOf(child);
    return own < parent || (!allowEqual && own === parent) ? `(${text})` : text;
  };
  switch (node.t) {
    case "num": return node.text;
    case "id": return value(node.name) ?? (node.name === "pi" ? "π" : node.name);
    case "neg": return `−${wrap(node.arg, 3)}`;
    case "call": return node.name === "sqrt" && node.args.length === 1 ? `√(${print(node.args[0], value)})` : `${node.name}(${node.args.map((arg) => print(arg, value)).join(", ")})`;
    case "bin": {
      const p = PRECEDENCE[node.op];
      if (node.op === "^") {
        const exponent = node.right.t === "num" && /^\d$/.test(node.right.text) ? superscript(node.right.text) : `^${wrap(node.right, p)}`;
        return `${wrap(node.left, p, false)}${exponent}`;
      }
      const sign = node.op === "*" ? " × " : node.op === "-" ? " − " : ` ${node.op} `;
      // a - (b - c) and a / (b * c) need brackets on the right even at equal precedence
      const rightNeedsBrackets = node.op === "-" || node.op === "/";
      return `${wrap(node.left, p)}${sign}${wrap(node.right, p, !rightNeedsBrackets)}`;
    }
  }
}

export const names = (node: Node): string[] =>
  node.t === "id" ? [node.name] : node.t === "neg" ? names(node.arg) : node.t === "bin" ? [...names(node.left), ...names(node.right)] : node.t === "call" ? node.args.flatMap(names) : [];

/** A number as it is written when substituted into a formula. */
export const asWritten = (value: number) => significant(value, 4);
