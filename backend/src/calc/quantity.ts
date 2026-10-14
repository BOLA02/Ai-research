/** Engineering notation: reading values like 4.7k or 100m, and writing results like 3.77 kΩ. */

const SUFFIXES: Record<string, number> = { T: 1e12, G: 1e9, M: 1e6, k: 1e3, m: 1e-3, u: 1e-6, µ: 1e-6, μ: 1e-6, n: 1e-9, p: 1e-12 };

/** Reads "12", "4.7k", "100m", "2.2e-3" or "1u". Returns null when it is not a number. */
export function parseValue(raw: string): number | null {
  const text = raw.trim().replace(/,/g, "").replace(/\s+/g, "");
  const match = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)([TGMkmuµμnp]?)$/.exec(text);
  if (!match) return null;
  const value = Number(match[1]) * (match[2] ? SUFFIXES[match[2]] : 1);
  return Number.isFinite(value) ? value : null;
}

const PREFIXES: [number, string][] = [[1e12, "T"], [1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"]];

/** Units that take an SI prefix. Others, such as %, °C and dB, are written as they are. */
const PREFIXABLE = new Set(["V", "A", "Ω", "W", "F", "H", "Hz", "s", "J", "C", "S", "VA", "VAR", "Wh", "T", "N", "m", "g", "B", "bit", "b"]);

const SUPERSCRIPT: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
export const superscript = (text: string) => [...text].map((char) => SUPERSCRIPT[char] ?? char).join("");

/** A number to a given count of significant figures, without trailing zeros. */
export function significant(value: number, digits = 4) {
  if (value === 0) return "0";
  const rounded = Number(value.toPrecision(digits));
  const abs = Math.abs(rounded);
  if (abs >= 1e6 || abs < 1e-3) {
    const [mantissa, exponent] = rounded.toExponential(Math.max(0, digits - 1)).split("e");
    const trimmed = String(Number(mantissa));
    return `${trimmed} × 10${superscript(String(Number(exponent)))}`;
  }
  return String(rounded);
}

/** A result with its unit, for example 3766.67 and "Ω" becomes "3.767 kΩ". */
export function formatQuantity(value: number, unit: string, options: { digits?: number; decimals?: number } = {}) {
  const symbol = unit.trim();
  if (options.decimals !== undefined) return `${value.toFixed(options.decimals)}${symbol ? ` ${symbol}` : ""}`;
  const digits = options.digits ?? 4;
  if (!symbol) return significant(value, digits);
  if (!PREFIXABLE.has(symbol) || value === 0) return `${significant(value, digits)} ${symbol}`;
  const abs = Math.abs(value);
  const [scale, prefix] = PREFIXES.find(([factor]) => abs >= factor * 0.9995) ?? PREFIXES[PREFIXES.length - 1];
  return `${significant(value / scale, digits)} ${prefix}${symbol}`;
}

const E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
const E24 = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];

/** The nearest standard preferred value, measured on a log scale, such as 3766 to 3900 in the E12 series. */
export function nearestStandard(value: number, series: number[]) {
  if (!(value > 0) || !Number.isFinite(value)) return NaN;
  const decade = Math.floor(Math.log10(value));
  const candidates = [decade - 1, decade, decade + 1].flatMap((d) => series.map((step) => Number((step * 10 ** d).toPrecision(12))));
  return candidates.reduce((best, candidate) => (Math.abs(Math.log(candidate / value)) < Math.abs(Math.log(best / value)) ? candidate : best));
}

export const e12 = (value: number) => nearestStandard(value, E12);
export const e24 = (value: number) => nearestStandard(value, E24);
