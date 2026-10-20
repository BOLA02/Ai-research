import { prisma } from "../../lib/prisma";

export type ActivityType =
  | "signup" | "login" | "login_failed" | "logout"
  | "password_reset_requested" | "password_reset_completed"
  | "onboarding_completed" | "project_created" | "project_deleted"
  | "export_docx" | "image_uploaded" | "ai_review"
  | "account_deactivated" | "account_activated";

type Event = { type: ActivityType; userId?: string | null; projectId?: string | null; meta?: Record<string, string | number | boolean | null>; ip?: string | null };

/**
 * Notes that something happened. It never slows or breaks the request: a failure to
 * write the note is only logged. Keep `meta` to short facts, never to student text.
 */
export function recordActivity(event: Event) {
  void prisma.activityLog
    .create({ data: { type: event.type, userId: event.userId ?? null, projectId: event.projectId ?? null, meta: event.meta ?? undefined, ip: event.ip ? event.ip.slice(0, 64) : null } })
    .catch((error) => console.error("Could not record activity", event.type, error instanceof Error ? error.message : error));
}
