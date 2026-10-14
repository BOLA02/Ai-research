import { CONSTANTS, CalcError, RESERVED, asWritten, evaluate, names, own, parse, print } from "./expression";
import { formatQuantity, parseValue } from "./quantity";

export type Variable = { symbol: string; name?: string; value: string; unit?: string };
export type Step = { symbol: string; name?: string; expression: string; unit?: string; decimals?: number | null };
export type CalculationInput = { variables: Variable[]; steps: Step[]; note?: string | null };

export type StepResult = {
  symbol: string;
  value: number | null;
  /** The full line as it appears in the report. */
  line: string;
  error: string | null;
};

export type VariableResult = { symbol: string; error: string | null };

export type CalculationResult = {
  variables: VariableResult[];
  steps: StepResult[];
  /** Every line of the working, in order, ready for the report. */
  lines: string[];
  ok: boolean;
};

const SYMBOL = /^[\p{L}][\p{L}\p{N}_]*$/u;

function symbolError(symbol: string, taken: Set<string>) {
  if (!symbol.trim()) return "Give it a symbol";
  if (!SYMBOL.test(symbol)) return `"${symbol}" is not a valid symbol. Use letters, numbers and _, starting with a letter`;
  if (RESERVED.has(symbol) || symbol in Object.prototype) return `"${symbol}" is reserved, so choose another symbol`;
  if (taken.has(symbol)) return `"${symbol}" is already used`;
  return null;
}

/** Works through a calculation step by step and writes each line the way it is shown in a report. */
export function evaluateCalculation(input: CalculationInput): CalculationResult {
  const scope: Record<string, number> = {};
  const taken = new Set<string>();
  const variables: VariableResult[] = [];

  for (const variable of input.variables) {
    let error = symbolError(variable.symbol, taken);
    const value = parseValue(variable.value);
    if (!error && value === null) error = `"${variable.value}" is not a number. Write it like 12, 4.7k or 100m`;
    if (!error && value !== null) {
      scope[variable.symbol] = value;
      taken.add(variable.symbol);
    }
    variables.push({ symbol: variable.symbol, error });
  }

  const steps: StepResult[] = [];
  for (const step of input.steps) {
    let line = `${step.symbol || "?"} = ${step.expression}`;
    try {
      const problem = symbolError(step.symbol, taken);
      if (problem) throw new CalcError(problem);
      const tree = parse(step.expression);
      const value = evaluate(tree, scope);
      const symbolic = print(tree);
      const substituted = print(tree, (name) => (own(scope, name) ? asWritten(scope[name]) : own(CONSTANTS, name) ? asWritten(CONSTANTS[name]) : null));
      const result = formatQuantity(value, step.unit ?? "", { decimals: step.decimals ?? undefined });
      const usesNames = names(tree).some((name) => own(scope, name));
      line = [step.symbol, symbolic, ...(usesNames && substituted !== symbolic ? [substituted] : []), result].join(" = ");
      scope[step.symbol] = value;
      taken.add(step.symbol);
      steps.push({ symbol: step.symbol, value, line, error: null });
    } catch (error) {
      if (!(error instanceof CalcError)) throw error;
      steps.push({ symbol: step.symbol, value: null, line, error: error.message });
    }
  }

  const lines = [...steps.map((step) => step.line), ...(input.note?.trim() ? [input.note.trim()] : [])];
  const ok = variables.every((v) => !v.error) && steps.every((s) => !s.error);
  return { variables, steps, lines, ok };
}
