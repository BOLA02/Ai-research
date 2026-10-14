import type {
  ChapterTemplate,
  DocumentTemplate,
  FormatRules,
  Milestone,
  ReportTemplate,
  Requirement,
  SectionTemplate,
} from "./types";

const section = (
  key: string,
  title: string,
  purpose: string,
  prompts: string[],
  extra: Partial<SectionTemplate> = {},
): SectionTemplate => ({
  key,
  title,
  guidance: { purpose, prompts, tips: extra.guidance?.tips },
  ...(extra.optional ? { optional: true } : {}),
  ...(extra.children ? { children: extra.children } : {}),
});

const tips = (items: string[]) => ({ guidance: { purpose: "", prompts: [], tips: items } });

/** Source: Kaduna Polytechnic EEE HND Project Committee guidelines (2023) and the institution-wide guidelines (2019). */
export const FORMAT: FormatRules = {
  paper: "A4",
  fontFamily: "Times New Roman",
  fontSizePt: 12,
  bodyLineSpacing: 1.5,
  abstractLineSpacing: 1,
  marginsMm: { left: 25, top: 20, right: 20, bottom: 20 },
  justified: true,
  paragraphIndent: false,
  pageNumberPosition: "top-right",
  preliminaryNumbering: "roman",
  maxHeadingDepth: 3,
  coverFontSizePt: 16,
  titlePageFontSizePt: 14,
  captionStyle: { bold: true, centred: true },
  tableFontMinPt: 10,
  appendixLabel: "roman",
  minPages: 50,
  maxPages: 120,
};

const DECLARATION = `I, ______________________ hereby declare that this research project titled "{{title}}" was carried out by me in the Department of Electrical and Electronic Engineering under the supervision of ______________________ in partial fulfilment of the requirement for the award of Higher National Diploma (HND) in Electrical and Electronic Engineering and to the best of my knowledge it has not been presented anywhere for the award of any degree or certificate. However, authors whose works have been referred to in this project have been duly acknowledged.`;

const APPROVAL = `This is to certify that this research project titled "{{title}}" by ______________________ with registration number ______________________ meets the regulations governing the preparation and presentation of research project in Kaduna Polytechnic.

Project Supervisor: ______________________ Date: __________
Project Coordinator: ______________________ Date: __________
Head of Department: ______________________ Date: __________
External Examiner: ______________________ Date: __________`;

const documents: DocumentTemplate[] = [
  {
    type: "COVER_PAGE",
    title: "Cover Page",
    numbering: "none",
    generated: true,
    guidance: {
      purpose: "The first page of the hard copy. It gives the official identity of the project.",
      prompts: ["What is the exact title of your project?", "What are your full name and registration number?"],
      tips: [
        "Everything is in ALL CAPS and 16 pt.",
        "The title must match the Abstract and Approval page exactly.",
        "Use the semester you will graduate in as the year.",
      ],
    },
  },
  {
    type: "FLY_LEAF",
    title: "Fly Leaf",
    numbering: "none",
    generated: true,
    guidance: {
      purpose: "A blank page after the cover.",
      prompts: [],
      tips: ["Leave it blank."],
    },
  },
  {
    type: "TITLE_PAGE",
    title: "Title Page",
    numbering: "none",
    generated: true,
    guidance: {
      purpose: "A copy of the cover page in a smaller size.",
      prompts: [],
      tips: ["Same as the cover page but 14 pt.", "It is counted in the numbering but shows no page number."],
    },
  },
  {
    type: "DECLARATION",
    title: "Declaration",
    numbering: "roman",
    defaultContent: DECLARATION,
    guidance: {
      purpose: "A statement that the work is yours and not copied. It protects you and the department.",
      prompts: ["Who supervised you? Use their full name(s).", "When was the research concluded?"],
      tips: ["Use your full name and your supervisor's full name."],
    },
  },
  {
    type: "APPROVAL_PAGE",
    title: "Approval Page",
    numbering: "roman",
    defaultContent: APPROVAL,
    guidance: {
      purpose: "The page the supervisor, coordinator, head of department and external examiner sign.",
      prompts: ["Who are your supervisor, project coordinator and HOD?"],
      tips: ["It is signed on the printed copy. Leave the lines blank."],
    },
  },
  {
    type: "DEDICATION",
    title: "Dedication",
    numbering: "roman",
    optional: true,
    guidance: {
      purpose: "An optional page to thank the people closest to you.",
      prompts: ["Who do you want to dedicate this work to, and why?"],
      tips: ["Not every report needs one. Skip it if you are not sure."],
    },
  },
  {
    type: "ACKNOWLEDGEMENT",
    title: "Acknowledgement",
    numbering: "roman",
    guidance: {
      purpose: "Thanks to those who helped you do the work.",
      prompts: [
        "Who supervised and guided you?",
        "Which people or organisations gave you materials, lab access or funding?",
        "Who helped with testing, proof-reading or data?",
      ],
      tips: ["Name the people with the biggest contribution first.", "Keep it factual and sincere."],
    },
  },
  {
    type: "TABLE_OF_CONTENTS",
    title: "Table of Contents",
    numbering: "roman",
    generated: true,
    guidance: {
      purpose: "Shows the examiner how the report is organised.",
      prompts: [],
      tips: ["It is built from your chapter and section titles. Headings must match the text exactly."],
    },
  },
  {
    type: "LIST_OF_SYMBOLS_ABBREVIATIONS",
    title: "List of Symbols and Abbreviations",
    numbering: "roman",
    guidance: {
      purpose: "Explains every symbol and abbreviation used in the report.",
      prompts: ["Which symbols (e.g. V, I, R, f) and abbreviations (e.g. IC, PCB, LED) did you use?"],
      tips: ["Only list what actually appears in the report."],
    },
  },
  {
    type: "LIST_OF_TABLES",
    title: "List of Tables",
    numbering: "roman",
    generated: true,
    guidance: {
      purpose: "Lists every table with its number, title and page.",
      prompts: [],
      tips: ["Built from the tables you add. Tables are numbered separately from figures."],
    },
  },
  {
    type: "LIST_OF_FIGURES",
    title: "List of Figures",
    numbering: "roman",
    generated: true,
    guidance: {
      purpose: "Lists every figure with its number, title and page.",
      prompts: [],
      tips: ["Built from the figures you add. Every imported figure needs a citation."],
    },
  },
  {
    type: "ABSTRACT",
    title: "Abstract",
    numbering: "roman",
    guidance: {
      purpose: "The whole project in miniature. Many readers only read this.",
      prompts: [
        "What did you set out to do and why?",
        "What did you do (design, build, test)?",
        "What were the most important results?",
        "What do the results mean?",
      ],
      tips: [
        "Write it last.",
        "Single line spacing.",
        "Do not refer to figures or give background information.",
      ],
    },
  },
];

const introduction = (): ChapterTemplate => ({
  key: "introduction",
  number: 1,
  title: "Introduction",
  sections: [
    section(
      "background",
      "Background of the Report",
      "Shows where the study comes from and why it matters. Move from the general to the specific.",
      ["What is the wider area of your project?", "What real-world situation led to this project?"],
      tips(["Be selective: cite only studies that support your point."]),
    ),
    section(
      "problem-statement",
      "Statement of the Problem",
      "Describes the problem your project solves.",
      ["What exactly is wrong or missing today?", "Who is affected and how?"],
    ),
    section(
      "aim-objectives",
      "Aim and Objectives of the Study",
      "The aim is the expected outcome. The objectives are the steps that achieve it.",
      ["What is the single aim of the project?", "List 3 to 5 specific objectives. Can each one be tested at the end?"],
      tips(["Your Chapter 5 and 6 are judged against these objectives."]),
    ),
    section(
      "methodology-overview",
      "Methodology",
      "A step-by-step outline of how the project was carried out.",
      ["What are the steps from the first idea to the working project?"],
    ),
    section(
      "scope",
      "Scope of the Study",
      "States what the project covers and what it does not.",
      ["What does your project include?", "What is left out, and why?"],
    ),
    section(
      "report-outline",
      "Report Outline",
      "A short guide to what each chapter contains.",
      ["In one or two lines each, what does every chapter cover?"],
    ),
  ],
});

const conclusions = (): ChapterTemplate => ({
  key: "conclusions",
  number: 6,
  title: "Conclusions and Recommendations",
  sections: [
    section(
      "conclusion",
      "Conclusion",
      "Outlines how far the project succeeded against the objectives you set.",
      ["Did you meet each objective? Which results prove it?", "What were the most important findings?"],
      tips(["Do not speculate about things you did not test."]),
    ),
    section(
      "recommendation",
      "Recommendation",
      "Suggests improvements and further work.",
      ["What would you improve with more time or money?", "What can the next student build on?"],
    ),
  ],
});

const designChapters: ChapterTemplate[] = [
  introduction(),
  {
    key: "literature-review",
    number: 2,
    title: "Literature Review",
    sections: [
      section(
        "lit-introduction",
        "Introduction to Literature Review",
        "Tells the reader what the chapter covers.",
        ["What areas of existing work will you review and why?"],
      ),
      section(
        "fundamental-concepts",
        "Review of Fundamental Concepts",
        "Explains the components and theory the reader needs to follow your design.",
        ["Which components and principles does your project rely on?", "Can you explain each one in a short paragraph?"],
        tips(["Cite every source with Insert › Citation, so it follows your reference style."]),
      ),
      section(
        "related-works",
        "Review of Related Works",
        "Compares your project with what others have already done.",
        ["Which projects or papers are closest to yours?", "What did each one do, and what were its limits?"],
        tips(["An HND project needs at least 5 related works."]),
      ),
      section(
        "present-work",
        "Present Research Work",
        "Briefly introduces your own solution.",
        ["In a few lines, what are you building and how is it different?"],
      ),
      section(
        "research-gap",
        "Research Gap",
        "Names what earlier work did not do and your project fills.",
        ["What is missing in the works you reviewed?"],
      ),
      section(
        "area-of-application",
        "Area of Application",
        "Where the project can be used.",
        ["Where could the finished project be used, and by whom?"],
      ),
      section(
        "lit-conclusion",
        "Conclusion",
        "Summarises the chapter.",
        ["What is the main point the reader should take from this chapter?"],
      ),
    ],
  },
  {
    key: "design-methodology",
    number: 3,
    title: "Design Methodology",
    sections: [
      section(
        "design-introduction",
        "Introduction",
        "Previews the design approach.",
        ["What are the main blocks of your system?"],
      ),
      section(
        "design-specification",
        "Design Specification",
        "The requirements the design must meet.",
        ["What voltage, current, power or speed must it handle?", "What size, cost or safety limits apply?"],
        tips(["Give numbers with units."]),
      ),
      section(
        "design-assumptions",
        "Design Assumptions",
        "Anything you assumed to simplify the design.",
        ["What did you assume (for example supply voltage, ambient temperature)?"],
        { optional: true },
      ),
      section(
        "design-analysis",
        "Design Analysis",
        "The calculations behind every unit of the design.",
        ["Show each formula, the values you used and the result."],
        {
          children: [
            section(
              "power-supply-design",
              "Design of Power Supply Unit",
              "Calculations for the power supply.",
              ["What input and output does the supply need? How did you choose the transformer, rectifier and regulator?"],
              { optional: true },
            ),
            section(
              "circuit-design",
              "Circuit Design",
              "Calculations for the main circuit.",
              ["How did you work out each component value?"],
            ),
            section(
              "other-unit-design",
              "Design of Other Units",
              "Any other unit worth its own design, such as a driver circuit.",
              ["Which other units need their own calculations?"],
              { optional: true },
            ),
          ],
        },
      ),
      section(
        "component-selection",
        "Components Selection",
        "Why each component was chosen.",
        ["Which parts did you choose, with ratings?", "Why this part and not another?"],
      ),
      section(
        "circuit-diagram",
        "Circuit Diagram and Principles of Operation",
        "The full circuit and how it works.",
        ["Can you walk the reader through the circuit from input to output?"],
        tips(["Label the figure and cite its source if it is not yours."]),
      ),
      section(
        "circuit-simulation",
        "Circuit Simulation(s)",
        "Simulation results that check the design before building.",
        ["Which software did you use?", "What did the simulation show?"],
      ),
      section(
        "design-conclusion",
        "Conclusion",
        "Summarises the chapter.",
        ["What did this chapter establish?"],
      ),
    ],
  },
  {
    key: "construction-packaging",
    number: 4,
    title: "Construction and Packaging",
    sections: [
      section(
        "construction-introduction",
        "Introduction",
        "Previews how the design was turned into hardware.",
        ["What was built and in what order?"],
      ),
      section(
        "construction",
        "Construction",
        "How the project was physically built.",
        ["What did you use, and how did you build it?"],
        {
          children: [
            section("construction-tools", "Construction Tools", "The tools used.", ["Which tools did you use?"]),
            section(
              "construction-materials",
              "Construction Materials",
              "The materials used.",
              ["Which materials, with quantities, did you use?"],
            ),
            section(
              "construction-procedure",
              "Construction Procedures",
              "The steps taken, in order.",
              ["What did you do first, next and last?"],
              tips(["Use past tense and enough detail that someone could repeat it."]),
            ),
            section(
              "layout-diagram",
              "Layout Diagram",
              "A diagram of how the parts are arranged.",
              ["Where does each part sit on the board or in the enclosure?"],
            ),
          ],
        },
      ),
      section(
        "packaging",
        "Packaging",
        "How the project was housed and finished.",
        ["What enclosure did you use and why?"],
        {
          children: [
            section(
              "packaging-procedure",
              "Packaging Procedures",
              "The steps and considerations in packaging.",
              ["How did you fit, mount and protect the parts?"],
            ),
            section(
              "pictorial-view",
              "Pictorial View",
              "Photos of the finished project.",
              ["Add clear photos of the finished project from more than one side."],
            ),
          ],
        },
      ),
      section(
        "construction-conclusion",
        "Conclusion",
        "Summarises the chapter.",
        ["What was achieved in construction and packaging?"],
      ),
    ],
  },
  {
    key: "testing-results",
    number: 5,
    title: "Testing and Result",
    sections: [
      section(
        "testing-introduction",
        "Introduction",
        "Restates the objectives that the tests will check.",
        ["What were your objectives? Which test checks each one?"],
      ),
      section(
        "testing-procedure",
        "Testing Procedure(s)",
        "How the project was tested.",
        ["What equipment did you use and what steps did you follow?"],
        tips(["Use past tense. Do not mix results with procedure."]),
      ),
      section(
        "results",
        "Results",
        "What the tests showed, one part at a time.",
        ["What did you measure for each part of the project?"],
        {
          children: [
            section(
              "result-1",
              "Result of the First Unit",
              "Results for one unit or segment.",
              ["Present readings in a table or graph and label the axes."],
            ),
            section(
              "result-2",
              "Result of the Second Unit",
              "Results for another unit or segment.",
              ["Present readings in a table or graph and label the axes."],
              { optional: true },
            ),
          ],
        },
      ),
      section(
        "discussions",
        "Discussions",
        "Explains the results against the stated objectives.",
        ["Did each result meet its objective?", "Where did results differ from expected, and why?"],
        tips(["Be clear, impartial and objective. Report results that disagree with your expectations too."]),
      ),
      section(
        "testing-conclusion",
        "Conclusions",
        "Summarises the chapter.",
        ["What do the results show overall?"],
      ),
    ],
  },
  conclusions(),
];

/**
 * Maintenance chapters 1 to 3 come from the department slides. The slides give no
 * maintenance version of chapters 4 to 6, so the student names those chapters and
 * adds their sections.
 */
const maintenanceChapters: ChapterTemplate[] = [
  introduction(),
  {
    key: "literature-review",
    number: 2,
    title: "Literature Review",
    sections: [
      section(
        "lit-introduction",
        "Introduction to Literature Review",
        "Tells the reader what the chapter covers.",
        ["What will you review and why?"],
      ),
      section(
        "fundamental-concepts",
        "Review of Fundamental Concepts",
        "Types of maintenance and the theory of the equipment being maintained.",
        ["Which types of maintenance apply?", "How does the equipment or component work?"],
      ),
      section(
        "related-maintenance-works",
        "Review of Related Maintenance Works",
        "Compares your work with similar maintenance done by others.",
        ["Which similar maintenance jobs or papers did you find?"],
      ),
      section(
        "present-maintenance-work",
        "Present Maintenance Work",
        "Briefly introduces your own maintenance work.",
        ["What equipment did you maintain and what was wrong with it?"],
      ),
      section(
        "lit-conclusion",
        "Conclusion",
        "Summarises the chapter.",
        ["What is the main point of this chapter?"],
      ),
    ],
  },
  {
    key: "troubleshooting-remedy",
    number: 3,
    title: "Trouble Shooting and Remedy",
    sections: [
      section(
        "ts-introduction",
        "Introduction",
        "Previews the troubleshooting approach.",
        ["What was the equipment doing, or not doing?"],
      ),
      section(
        "maintenance-problems",
        "Maintenance Problem(s)",
        "Describes each problem and whether it is corrective or preventive.",
        ["What is the nature of each problem?", "Is each one corrective or preventive maintenance?"],
      ),
      section(
        "troubleshooting-method",
        "Troubleshooting Method",
        "How you searched for the fault.",
        ["Which fault-finding method did you use and why?"],
      ),
      section(
        "maintenance-approach",
        "Maintenance Approach",
        "The step-by-step way each problem was resolved.",
        ["What did you do for each fault, in order?"],
        {
          children: [
            section("approach-1", "First Fault and Remedy", "One fault and how it was fixed.", ["What was found and how was it fixed?"]),
            section(
              "approach-2",
              "Second Fault and Remedy",
              "Another fault and how it was fixed.",
              ["What was found and how was it fixed?"],
              { optional: true },
            ),
          ],
        },
      ),
      section(
        "circuit-wiring",
        "Circuit/Wiring Diagrams and Principle of Operation",
        "The circuit of the area maintained and how it works.",
        ["Draw the circuit of the area you worked on and explain how it operates."],
      ),
      section(
        "ts-conclusion",
        "Conclusion",
        "Summarises the chapter.",
        ["What was repaired and how do you know it works?"],
      ),
    ],
  },
  ...[4, 5, 6].map(
    (number): ChapterTemplate => ({
      key: `chapter-${number}`,
      number,
      title: `Chapter ${["", "", "", "", "Four", "Five", "Six"][number]}`,
      studentDefined: true,
      sections: [],
    }),
  ),
];

const requirements: Requirement[] = [
  {
    id: "related-works-min",
    sectionKey: "related-works",
    minItems: 5,
    message: "An HND project needs at least 5 related works in the literature review.",
  },
];

const milestones: Milestone[] = [
  { id: "topic", title: "Submit topic and outline", timing: "2–3 weeks after the third semester starts", detail: "Tell the Research Project Coordinator your tentative title and outline." },
  { id: "proposal-defence", title: "Proposal defence seminar", timing: "2–4 weeks after topic assignment", detail: "Defend your outline and literature survey before the panel. The proposal is 3 to 5 pages." },
  { id: "midterm", title: "Mid-term progress review seminar", timing: "8 weeks after the topic is assigned", detail: "Present the status of the project." },
  { id: "final-draft", title: "Final draft to supervisor", timing: "Week 15 of the second/fourth semester", detail: "Submit the full draft for comments and corrections." },
  { id: "internal-defence", title: "Internal project defence", timing: "3 weeks after semester exams", detail: "Defend by oral examination or poster. Submit a soft copy and 2 spiral-bound copies before it." },
  { id: "final-defence", title: "Final project defence", timing: "4 weeks after semester exams", detail: "The external examiner is present. Afterwards submit corrected work: a soft copy and 4 hard copies." },
];

const base = {
  institution: "Kaduna Polytechnic",
  department: "Electrical and Electronic Engineering",
  programme: "HND",
  referenceStyle: "IEEE" as const,
  documents,
  requirements,
  milestones,
  format: FORMAT,
};

export const eeeHndDesign: ReportTemplate = {
  ...base,
  id: "eee-hnd-design",
  name: "EEE HND: Design and Construction",
  projectType: "DESIGN",
  chapters: designChapters,
};

export const eeeHndMaintenance: ReportTemplate = {
  ...base,
  id: "eee-hnd-maintenance",
  name: "EEE HND: Maintenance and Repair",
  projectType: "MAINTENANCE",
  chapters: maintenanceChapters,
};
