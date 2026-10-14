"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, HelpCircle, Loader2, MessageSquareQuote, PenLine, Sparkles } from "lucide-react";
import { ApiError, api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace/provider";
import { wordCount } from "@/lib/workspace/outline";
import type { CoachReview, CoachStatus } from "@/lib/workspace/types";

const MIN_WORDS = 30;

const READINESS: Record<CoachReview["readiness"], { label: string; tone: string }> = {
  needs_more: { label: "Needs more writing", tone: "pf-tag-accent" },
  developing: { label: "Developing", tone: "" },
  nearly_there: { label: "Nearly there", tone: "pf-tag-brand" },
};

type Saved = { review: CoachReview; reviewedText: string; at: number };
// Kept for the session, so coming back to a section shows the last feedback.
const cache = new Map<string, Saved>();

type Props = {
  target: { kind: "section" | "document"; id: string };
  content: string;
  /** Adds one of the coach's questions to the student's text. */
  onUseQuestion: (question: string) => void;
};

export function CoachPanel({ target, content, onUseQuestion }: Props) {
  const { project, flushSaves } = useWorkspace();
  const [status, setStatus] = useState<CoachStatus | null>(null);
  const [saved, setSaved] = useState<Saved | null>(cache.get(target.id) ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const live = useRef(true);

  // Skip state updates after leaving the page. Set it back to true on mount, because in development
  // React mounts, unmounts and mounts again, and the cleanup alone would leave it false for good.
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  useEffect(() => setSaved(cache.get(target.id) ?? null), [target.id]);
  useEffect(() => {
    api<CoachStatus>("/ai/status").then(setStatus).catch(() => setStatus(null));
  }, []);

  // Not set up on the server: say nothing rather than show a feature that cannot work.
  if (!status?.enabled || !project) return null;

  const words = wordCount(content);
  const tooShort = words < MIN_WORDS;
  const outOfReviews = status.remaining <= 0;
  const changed = saved ? saved.reviewedText !== content : false;

  const ask = async () => {
    setBusy(true);
    setError("");
    try {
      await flushSaves(); // the coach reads what is saved, so save first
      const data = await api<{ review: CoachReview } & CoachStatus>(`/projects/${project.id}/ai/review`, { method: "POST", body: JSON.stringify(target) });
      const next = { review: data.review, reviewedText: content, at: Date.now() };
      cache.set(target.id, next);
      if (live.current) {
        setSaved(next);
        setStatus({ enabled: true, dailyLimit: data.dailyLimit, remaining: data.remaining });
      }
    } catch (reason) {
      if (live.current) setError(reason instanceof ApiError ? reason.message : "Something went wrong. Please try again.");
    } finally {
      if (live.current) setBusy(false);
    }
  };

  const review = saved?.review;

  return (
    <section className="pf-card pf-guide-card" aria-label="Writing coach">
      <h2><Sparkles size={16} aria-hidden /> Writing coach</h2>

      {!review && (
        <p>Get feedback on what you've written so far, measured against your department's guidance and what examiners look for. It tells you what to improve. It won't write it for you.</p>
      )}

      <div style={{ display: "grid", gap: 8, marginTop: review ? 0 : 12 }}>
        <button className="pf-btn pf-btn-sm" onClick={ask} disabled={busy || tooShort || outOfReviews} style={{ justifySelf: "start" }}>
          {busy ? <><Loader2 size={14} className="spin" aria-hidden /> Reading…</> : review ? "Review again" : "Review what I've written"}
        </button>
        <p className="pf-hint" style={{ margin: 0 }} role="status">
          {tooShort ? `Write at least ${MIN_WORDS} words first. You have ${words}.` : outOfReviews ? "You've used all of today's reviews. They reset at midnight UTC." : `${status.remaining} of ${status.dailyLimit} reviews left today.`}
        </p>
      </div>

      {error && <div className="pf-alert" role="alert" style={{ marginTop: 10 }}>{error}</div>}

      {review && (
        <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
          {changed && <div className="pf-callout" style={{ margin: 0, padding: 10, fontSize: 13 }}><AlertTriangle size={16} aria-hidden style={{ flex: "none", marginTop: 1 }} /><span>You've changed your text since this review.</span></div>}

          <div>
            <span className={`pf-tag ${READINESS[review.readiness].tone}`}>{READINESS[review.readiness].label}</span>
            <p style={{ marginTop: 8 }}>{review.overall}</p>
          </div>

          {review.strengths.length > 0 && (
            <div>
              <h3 className="pf-coach-h"><CheckCircle2 size={14} aria-hidden /> What's working</h3>
              <ul className="pf-tips">{review.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          )}

          {review.gaps.length > 0 && (
            <div>
              <h3 className="pf-coach-h"><PenLine size={14} aria-hidden /> Worth improving</h3>
              <ol className="pf-list" style={{ gap: 10 }}>
                {review.gaps.map((gap, index) => (
                  <li key={index} className="pf-gap">
                    <strong>{gap.issue}</strong>
                    {gap.quote && <blockquote><MessageSquareQuote size={13} aria-hidden /> “{gap.quote}”</blockquote>}
                    <p><b>Why it matters:</b> {gap.why}</p>
                    <p><b>What to do:</b> {gap.howToFix}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {review.questions.length > 0 && (
            <div>
              <h3 className="pf-coach-h"><HelpCircle size={14} aria-hidden /> Questions to answer in your text</h3>
              <ul className="pf-prompts">
                {review.questions.map((question) => (
                  <li key={question} className="pf-prompt">
                    <span>{question}</span>
                    <button type="button" onClick={() => onUseQuestion(question)} aria-label={`Add to your text: ${question}`}>Add</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {review.style.length > 0 && (
            <div>
              <h3 className="pf-coach-h">Style</h3>
              <ul className="pf-tips">{review.style.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      <p className="pf-hint" style={{ marginTop: 14 }}>
        This is feedback to help you, not a mark. It can be wrong, so check it with your supervisor. To give feedback, your text is sent to Anthropic's Claude. The report stays your own work.
      </p>
    </section>
  );
}
