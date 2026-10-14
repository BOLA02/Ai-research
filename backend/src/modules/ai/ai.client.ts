import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { env } from "../../config/env";
import { reviewSchema, type Review } from "./ai.schema";
import { SYSTEM_PROMPT } from "./ai.prompt";

/** The part of the model call the service depends on, so tests can swap it. */
export type ReviewClient = {
  review(userMessage: string): Promise<Review>;
};

export class AiUnavailableError extends Error {}
export class AiRefusedError extends Error {}

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }));

export const aiEnabled = () => Boolean(env.ANTHROPIC_API_KEY);

export const anthropicReviewClient: ReviewClient = {
  async review(userMessage) {
    if (!aiEnabled()) throw new AiUnavailableError("The writing coach is not set up");
    try {
      const response = await getClient().beta.messages.create({
        model: env.AI_MODEL,
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        // If a safety classifier declines the request, retry it on the model Anthropic recommends.
        fallbacks: "default",
        system: SYSTEM_PROMPT,
        // Thinking is on by default for this model. Medium effort is enough for feedback of this kind.
        output_config: { effort: "medium", format: zodOutputFormat(reviewSchema) },
        messages: [{ role: "user", content: userMessage }],
      } as Anthropic.Beta.MessageCreateParamsNonStreaming);

      if (response.stop_reason === "refusal") throw new AiRefusedError("The model declined to review this text");
      if (response.stop_reason === "max_tokens") throw new AiUnavailableError("The review was cut short");
      const text = response.content.find((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text");
      if (!text) throw new AiUnavailableError("The model returned no review");
      return reviewSchema.parse(JSON.parse(text.text));
    } catch (error) {
      if (error instanceof AiRefusedError || error instanceof AiUnavailableError) throw error;
      // Log the kind of failure, never the student's text.
      console.error("Writing coach request failed:", error instanceof Anthropic.APIError ? `${error.status} ${error.name}` : error instanceof Error ? error.name : "unknown");
      throw new AiUnavailableError("The writing coach could not be reached");
    }
  },
};
