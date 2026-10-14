export type ExperienceLevel = "beginner" | "intermediate" | "confident";

/** Each answer runs from 0 (least familiar) to 2 (most familiar). */
export type ReadinessAnswers = [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2];

/**
 * Questions, in order:
 * 1. Have you written a project report before?
 * 2. Do you know what goes in each chapter of your department's report?
 * 3. How comfortable are you citing sources in IEEE style?
 */
export function scoreReadiness(answers: ReadinessAnswers): ExperienceLevel {
  const total = answers[0] + answers[1] + answers[2];
  if (total <= 2) return "beginner";
  if (total <= 4) return "intermediate";
  return "confident";
}
