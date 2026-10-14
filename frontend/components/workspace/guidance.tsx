"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Compass, GraduationCap } from "lucide-react";
import type { Guidance } from "@/lib/workspace/types";
import { Tour, hasSeen, markSeen, type TourStep } from "./tour";

type Props = {
  guidance: Guidance;
  optional?: boolean;
  custom?: boolean;
  /** Link to the matching part of the worked example, when there is one. */
  exampleHref?: string;
  /** Extra cards under the guidance, such as the writing coach. */
  extra?: React.ReactNode;
  /** Called with a prompt the student chose to answer. */
  onUsePrompt?: (prompt: string) => void;
};

const SEEN = "pf-seen-guide";

/**
 * A small card with the purpose of the section and a "Guide me" button.
 * The detail (questions, tips, coach, example) is shown one piece at a time
 * in a spotlight guide so the student is never faced with everything at once.
 */
export function GuidancePanel({ guidance, optional, custom, exampleHref, extra, onUsePrompt }: Props) {
  const [touring, setTouring] = useState(false);
  const hasPurpose = guidance.purpose.length > 0;

  const steps = useMemo<TourStep[]>(() => {
    const list: TourStep[] = [];
    if (hasPurpose) {
      list.push({
        target: "paper",
        placement: "left",
        title: custom ? "About this section" : "What examiners expect",
        body: (
          <>
            <p>{guidance.purpose}</p>
            {optional && <p style={{ marginTop: 6 }}>This part is optional. You can leave it out if it doesn't apply.</p>}
          </>
        ),
      });
    }
    guidance.prompts.forEach((prompt, i) => {
      list.push({
        target: "paper",
        placement: "left",
        title: guidance.prompts.length > 1 ? `Question ${i + 1} of ${guidance.prompts.length}` : "Question to answer",
        body: <p>{prompt}</p>,
        action: onUsePrompt ? { label: "Add this question to my text", onClick: () => onUsePrompt(prompt) } : undefined,
      });
    });
    if (guidance.tips && guidance.tips.length > 0) {
      list.push({
        target: "paper",
        placement: "left",
        title: "Keep in mind",
        body: <ul>{guidance.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>,
      });
    }
    if (extra) {
      list.push({
        target: "coach",
        placement: "left",
        title: "Check your work",
        body: <p>When you have written something, the writing coach reads it and points out what to improve. It never writes your report for you.</p>,
      });
    }
    if (exampleHref) {
      list.push({
        target: "example",
        placement: "left",
        title: "See a finished example",
        body: <p>Not sure how it should look? Open the matching part of the worked example in a new tab.</p>,
      });
    }
    return list;
  }, [guidance, hasPurpose, custom, optional, extra, exampleHref, onUsePrompt]);

  // Offer the guide automatically the first time a student reaches a writing page.
  useEffect(() => {
    if (steps.length === 0 || hasSeen(SEEN)) return;
    const timer = window.setTimeout(() => setTouring(true), 600);
    return () => window.clearTimeout(timer);
  }, [steps.length]);

  const close = () => {
    markSeen(SEEN);
    setTouring(false);
  };

  return (
    <aside className="pf-guide" aria-label="Writing guidance">
      {hasPurpose && (
        <section className="pf-card pf-guide-card pf-guide-mini">
          <h2><GraduationCap size={16} aria-hidden /> {custom ? "About this section" : "What examiners expect"}</h2>
          <p>{guidance.purpose}</p>
          {optional && <p><span className="pf-tag pf-tag-accent">Optional</span> You can leave this out if it doesn't apply.</p>}
          {steps.length > 1 && (
            <button type="button" className="pf-btn pf-btn-sm pf-btn-primary" style={{ justifySelf: "start" }} onClick={() => setTouring(true)}>
              <Compass size={14} aria-hidden /> Guide me
            </button>
          )}
        </section>
      )}
      {exampleHref && (
        <Link data-tour="example" className="pf-btn pf-btn-sm" href={exampleHref} target="_blank" style={{ justifySelf: "start" }}>
          <BookOpen size={14} aria-hidden /> See this in the worked example
        </Link>
      )}
      {extra && <div data-tour="coach">{extra}</div>}
      {touring && <Tour steps={steps} label="Section guide" onClose={close} />}
    </aside>
  );
}
