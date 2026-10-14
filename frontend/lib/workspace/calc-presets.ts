import type { CalcStep, CalcVariable } from "./types";

export type CalcPreset = { id: string; title: string; summary: string; variables: CalcVariable[]; steps: CalcStep[]; note?: string };

/** Starting points for common electrical and electronic calculations. Students change the values to their own. */
export const CALC_PRESETS: CalcPreset[] = [
  {
    id: "ohm",
    title: "Ohm's law",
    summary: "Voltage from current and resistance.",
    variables: [{ symbol: "I", name: "Current", value: "20m", unit: "A" }, { symbol: "R", name: "Resistance", value: "470", unit: "Ω" }],
    steps: [{ symbol: "V", name: "Voltage", expression: "I * R", unit: "V" }],
  },
  {
    id: "divider",
    title: "Voltage divider",
    summary: "Output voltage from two resistors.",
    variables: [{ symbol: "V_in", name: "Input voltage", value: "12", unit: "V" }, { symbol: "R_1", value: "10k", unit: "Ω" }, { symbol: "R_2", value: "4.7k", unit: "Ω" }],
    steps: [{ symbol: "V_out", name: "Output voltage", expression: "V_in * R_2 / (R_1 + R_2)", unit: "V" }],
  },
  {
    id: "led",
    title: "LED series resistor",
    summary: "The resistor that sets the LED current, rounded to a standard value.",
    variables: [{ symbol: "V_s", name: "Supply voltage", value: "12", unit: "V" }, { symbol: "V_F", name: "LED forward voltage", value: "2", unit: "V" }, { symbol: "I_F", name: "LED current", value: "10m", unit: "A" }],
    steps: [
      { symbol: "R", name: "Resistor needed", expression: "(V_s - V_F) / I_F", unit: "Ω" },
      { symbol: "R_std", name: "Nearest standard value", expression: "e12(R)", unit: "Ω" },
    ],
  },
  {
    id: "driver",
    title: "Transistor driving a relay",
    summary: "The base resistor that saturates a transistor switch.",
    variables: [
      { symbol: "V_cc", name: "Supply voltage", value: "12", unit: "V" },
      { symbol: "R_coil", name: "Relay coil resistance", value: "400", unit: "Ω" },
      { symbol: "V_BE", name: "Base-emitter voltage", value: "0.7", unit: "V" },
      { symbol: "h_sat", name: "Forced gain", value: "10", unit: "" },
    ],
    steps: [
      { symbol: "I_C", name: "Coil current", expression: "V_cc / R_coil", unit: "A" },
      { symbol: "I_B", name: "Base current", expression: "I_C / h_sat", unit: "A" },
      { symbol: "R_B", name: "Base resistor", expression: "(V_cc - V_BE) / I_B", unit: "Ω" },
      { symbol: "R_std", name: "Nearest standard value", expression: "e12(R_B)", unit: "Ω" },
    ],
  },
  {
    id: "supply",
    title: "Rectifier and filter capacitor",
    summary: "Peak voltage and the smoothing capacitor for a power supply.",
    variables: [
      { symbol: "V_rms", name: "Transformer secondary", value: "12", unit: "V" },
      { symbol: "V_D", name: "Diode drop", value: "0.7", unit: "V" },
      { symbol: "I", name: "Load current", value: "100m", unit: "A" },
      { symbol: "f", name: "Mains frequency", value: "50", unit: "Hz" },
      { symbol: "V_r", name: "Allowed ripple", value: "1", unit: "V" },
    ],
    steps: [
      { symbol: "V_pk", name: "Peak voltage", expression: "V_rms * sqrt(2)", unit: "V" },
      { symbol: "V_dc", name: "Peak after the bridge", expression: "V_pk - 2 * V_D", unit: "V" },
      { symbol: "C", name: "Filter capacitor", expression: "I / (2 * f * V_r)", unit: "F" },
      { symbol: "V_min", name: "Lowest input to the regulator", expression: "V_dc - V_r", unit: "V" },
    ],
    note: "Chosen: 1000 µF, 25 V",
  },
  {
    id: "rc",
    title: "RC time constant and cut-off",
    summary: "How fast an RC filter responds.",
    variables: [{ symbol: "R", value: "10k", unit: "Ω" }, { symbol: "C", value: "100n", unit: "F" }],
    steps: [
      { symbol: "tau", name: "Time constant", expression: "R * C", unit: "s" },
      { symbol: "f_c", name: "Cut-off frequency", expression: "1 / (2 * pi * R * C)", unit: "Hz" },
    ],
  },
  {
    id: "power",
    title: "Power and energy",
    summary: "Power drawn by a load and the energy it uses over time.",
    variables: [{ symbol: "V", value: "230", unit: "V" }, { symbol: "I", value: "1.6", unit: "A" }, { symbol: "t", name: "Time in hours", value: "5", unit: "h" }],
    steps: [
      { symbol: "P", name: "Power", expression: "V * I", unit: "W" },
      { symbol: "E", name: "Energy used", expression: "P * t / 1000", unit: "kWh" },
    ],
  },
];
