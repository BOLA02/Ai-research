/**
 * Tells the server that something happened, so the site owner can see where students
 * get stuck. Only a few fixed kinds of event with short labels are accepted. It never
 * sends anything a student wrote, and it never gets in the way if it fails.
 */
import { API_BASE_URL } from "@/lib/api";

type Event =
  | { type: "guide_opened"; guide: string }
  | { type: "guide_closed"; guide: string; step: number; total: number; completed: boolean }
  | { type: "tool_opened"; tool: string }
  | { type: "client_error"; code: string };

export function track(event: Event) {
  try {
    void fetch(`${API_BASE_URL}/analytics/events`, { method: "POST", credentials: "include", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify(event) }).catch(() => {});
  } catch {
    /* ignore */
  }
}
