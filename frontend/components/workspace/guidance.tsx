"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, Lightbulb, ListChecks } from "lucide-react";
import type { Guidance } from "@/lib/workspace/types";

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

/** "What examiners expect": purpose, question prompts and tips from the department guidelines. */
export function GuidancePanel({ guidance, optional, custom, exampleHref, extra, onUsePrompt }: Props) {
  const [open, setOpen] = useState(true);
  const hasPurpose = guidance.purpose.length > 0;

  return (
    <aside className="pf-guide" aria-label="Writing guidance">
      <button className="pf-btn pf-btn-sm pf-guide-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? "Hide guidance" : "Show guidance"}
      </button>
      {open && (
        <>
          {hasPurpose && (
            <section className="pf-card pf-guide-card">
              <h2><GraduationCap size={16} aria-hidden /> {custom ? "About this section" : "What examiners expect"}</h2>
              <p>{guidance.purpose}</p>
              {optional && <p style={{ marginTop: 8 }}><span className="pf-tag pf-tag-accent">Optional</span> You can leave this out if it doesn't apply.</p>}
            </section>
          )}
          {guidance.prompts.length > 0 && (
            <section className="pf-card pf-guide-card">
              <h2><ListChecks size={16} aria-hidden /> Questions to answer</h2>
              <ul className="pf-prompts">
                {guidance.prompts.map((prompt) => (
                  <li key={prompt} className="pf-prompt">
                    <span>{prompt}</span>
                    {onUsePrompt && <button type="button" onClick={() => onUsePrompt(prompt)} aria-label={`Add to your text: ${prompt}`}>Add</button>}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {exampleHref && (
            <Link className="pf-btn pf-btn-sm" href={exampleHref} target="_blank" style={{ justifySelf: "start" }}>
              <BookOpen size={14} aria-hidden /> See this in the worked example
            </Link>
          )}
          {guidance.tips && guidance.tips.length > 0 && (
            <section className="pf-card pf-guide-card">
              <h2><Lightbulb size={16} aria-hidden /> Remember</h2>
              <ul className="pf-tips">{guidance.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
            </section>
          )}
        </>
      )}
      {extra}
    </aside>
  );
}
