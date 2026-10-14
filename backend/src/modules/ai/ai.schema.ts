import { z } from "zod";

/** What the writing coach returns. It is feedback for the student to act on, never replacement text. */
export const reviewSchema = z.object({
  readiness: z.enum(["needs_more", "developing", "nearly_there"]).describe("Where this part stands. This is not a mark."),
  overall: z.string().describe("Two or three plain sentences on where this part stands and the most important thing to do next."),
  strengths: z.array(z.string()).describe("One to three things that work, each tied to the student's actual text."),
  gaps: z
    .array(
      z.object({
        issue: z.string().describe("What is missing, unclear or weak, in one sentence."),
        quote: z.string().describe("A short exact quote of at most 20 words from the student's text that this is about, or an empty string if the issue is something missing."),
        why: z.string().describe("Why an examiner would care, linked to the department's guidance or criteria."),
        howToFix: z.string().describe("What the student should do to improve it. Guidance only, not replacement text."),
      }),
    )
    .describe("The most important gaps first. At most five."),
  questions: z.array(z.string()).describe("Up to four questions the student should answer in their own words in this part."),
  style: z.array(z.string()).describe("Up to three notes on tense, tone, clarity, spelling or grammar, with a short example from the text."),
});

export type Review = z.infer<typeof reviewSchema>;

export const reviewRequestSchema = z
  .object({ kind: z.enum(["section", "document"]), id: z.string().uuid() })
  .strict();
