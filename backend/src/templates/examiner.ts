/**
 * What examiners look for, from Section 5 of the Kaduna Polytechnic Final Year Research Project
 * Report Guidelines (2019). The writing coach uses these to judge a student's text.
 */
export type ExaminerCriteria = {
  /** Points examiners are asked to consider (guidelines 5.1). */
  questions: string[];
  /** How the final report is assessed (guidelines 5.6). */
  reportCriteria: { criterion: string; weight: number }[];
};

export const KADUNA_POLY_EXAMINER_CRITERIA: ExaminerCriteria = {
  questions: [
    "Are the project aims (including research problem, research questions, boundaries and desired outcomes) well formulated?",
    "Are the background conditions and motivation described in sufficient detail to provide a rationale for the project?",
    "Are relevant concepts and empirical studies in open literature critically reviewed?",
    "Does the methodology fit with the aims and the stated problems of the study appropriately?",
    "Is the methodology consistent and reflecting an adequate amount of effort for an undergraduate student?",
    "Are the findings and experiences well summarised?",
    "Are the findings well discussed and are the implications valid for the candidate's own situation and conditions?",
    "Is it an original work of the student and what is the contribution to the area of research?",
    "Does the student maintain minimum expectations from scientific writing, including style of writing, presentation and grammatical expression?",
    "Does the study have the potential to be published in peer-reviewed journals or conference proceedings?",
  ],
  reportCriteria: [
    { criterion: "Background and problem identification", weight: 20 },
    { criterion: "Maintaining the structure and flow of the research project", weight: 20 },
    { criterion: "Results and analysis / quality improvement", weight: 30 },
    { criterion: "Quality of expression and clarity: writing style, spelling and grammar correctness", weight: 20 },
    { criterion: "Completeness and validity of the solution", weight: 10 },
  ],
};

/** Writing advice per kind of section, from the content summary in guidelines 6.1. */
export const SECTION_ADVICE: Record<string, string[]> = {
  ABSTRACT: [
    "The whole project in miniature: main objectives, methods, important results and main conclusions.",
    "Do not include references to figures, background information or citations.",
    "Extract the key points and condense the material.",
  ],
  background: [
    "Move from general to specific: relate problems in the real world to the research.",
    "Make clear links between the problem and the solution.",
    "Be selective in choosing studies to cite.",
  ],
  "related-works": [
    "Review relevant past research to provide a rationale for the work.",
    "Identify the gap in the previous studies that the work aims to fill.",
    "All literature must be cited in the text.",
  ],
  "design-analysis": ["Provide enough detail for replication of the work.", "Order procedures chronologically."],
  "construction-procedure": ["Provide enough detail for replication.", "Order procedures chronologically.", "Use the past tense to describe what was done. Do not mix results with procedure."],
  "testing-procedure": ["Use the past tense to describe what was done. Do not mix results with procedure.", "Provide enough detail for replication."],
  discussions: [
    "Restate the aim and objectives so the reader can refocus on the core of the report.",
    "Present and explain the data collected and the findings of the analysis and interpretation.",
    "Writing should be clear, impartial and objective. Each result that confirms or refutes an assumption should be noted in an unbiased manner.",
  ],
  conclusion: [
    "Outline the success of the project when compared with the objectives that were set.",
    "Summarise the most important findings and suggest further work.",
    "Make explanations complete. Avoid speculation that cannot be tested in the foreseeable future.",
    "Discuss possible reasons for expected or unexpected findings.",
  ],
};
