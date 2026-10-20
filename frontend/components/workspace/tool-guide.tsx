"use client";

import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import { Tour, hasSeen, markSeen, type TourStep } from "./tour";

/**
 * A "Guide me" button for a tool page. The guide opens by itself the first time the
 * tool is visited, then only when asked for.
 */
export function ToolGuide({ id, label, steps }: { id: string; label: string; steps: TourStep[] }) {
  const key = `pf-seen-tool-${id}`;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hasSeen(key)) return;
    const timer = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, [key]);

  return (
    <>
      <button type="button" className="pf-btn pf-btn-sm" onClick={() => setOpen(true)} data-tip={`A short step-by-step guide to ${label}`}>
        <Compass size={14} aria-hidden /> Guide me
      </button>
      {open && <Tour id={`tool-${id}`} steps={steps} label={`${label} guide`} onClose={() => { markSeen(key); setOpen(false); }} />}
    </>
  );
}
