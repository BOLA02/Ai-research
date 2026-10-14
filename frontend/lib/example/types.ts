export type Block =
  | { t: "p"; text: string; mark?: number }
  | { t: "list"; items: string[]; ordered?: boolean; mark?: number }
  | { t: "eq"; lines: string[]; mark?: number }
  | { t: "table"; caption: string; head: string[]; rows: string[][]; note?: string; mark?: number }
  | { t: "figure"; caption: string; nodes: string[]; mark?: number }
  | { t: "cover"; lines: string[] };

export type WhyPoint = {
  text: string;
  /** Highlights the block carrying the same mark when the learner picks this point. */
  mark?: number;
};

export type ExamplePart = {
  id: string;
  /** Group shown in the outline, e.g. "Chapter 3: Design Methodology". */
  group: string;
  /** Section number in the example report, e.g. "3.4.1". */
  number: string;
  title: string;
  /** Links the part to a template section so the editor can point here. */
  templateKey?: string;
  documentType?: string;
  blocks: Block[];
  why: { headline: string; points: WhyPoint[]; mistakes: string[] };
};
