"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AlertCircle, Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useWorkspace, type ContentTarget } from "@/lib/workspace/provider";
import { wordCount, type WritingItem } from "@/lib/workspace/outline";
import type { Guidance } from "@/lib/workspace/types";
import { GuidancePanel } from "./guidance";

type Props = {
  target: ContentTarget;
  title: string;
  onRename?: (title: string) => void;
  crumbs: { label: string; href?: string }[];
  content: string;
  guidance: Guidance;
  optional?: boolean;
  custom?: boolean;
  exampleHref?: string;
  placeholder: string;
  neighbours: { prev?: WritingItem; next?: WritingItem };
  banner?: React.ReactNode;
};

export function Editor({ target, title, onRename, crumbs, content, guidance, optional, custom, exampleHref, placeholder, neighbours, banner }: Props) {
  const { setContent, saveState } = useWorkspace();
  const area = useRef<HTMLTextAreaElement>(null);

  // Grow the textarea with its content so the page scrolls instead of the box.
  useEffect(() => {
    const element = area.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.max(element.scrollHeight, 380)}px`;
  }, [content, target.id]);

  const usePrompt = (prompt: string) => {
    const gap = content && !content.endsWith("\n") ? "\n\n" : content ? "\n" : "";
    setContent(target, `${content}${gap}${prompt}\n`);
    area.current?.focus();
  };

  return (
    <div className="pf-editor-wrap">
      <div>
        <nav className="pf-crumbs" aria-label="Breadcrumb">
          {crumbs.map((crumb, index) => (
            <span key={crumb.label} style={{ display: "contents" }}>
              {index > 0 && <ChevronRight size={13} aria-hidden />}
              {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span>{crumb.label}</span>}
            </span>
          ))}
        </nav>

        {onRename ? (
          <TitleInput value={title} onCommit={onRename} />
        ) : (
          <h1 className="pf-title-input" style={{ margin: "0 0 14px" }}>{title}</h1>
        )}

        {banner}

        <div className="pf-paper">
          <label className="sr-only" htmlFor="body" style={{ position: "absolute", left: -9999 }}>{title}</label>
          <textarea
            id="body"
            ref={area}
            className="pf-textarea"
            value={content}
            placeholder={placeholder}
            onChange={(event) => setContent(target, event.target.value)}
            spellCheck
          />
        </div>

        <div className="pf-editor-foot">
          <span>{wordCount(content)} words</span>
          <span className={`pf-save ${saveState === "error" ? "error" : ""}`} role="status" aria-live="polite">
            {saveState === "saving" && <><Loader2 size={14} className="spin" aria-hidden /> Saving…</>}
            {saveState === "saved" && <><Check size={14} aria-hidden /> Saved</>}
            {saveState === "error" && <><AlertCircle size={14} aria-hidden /> Couldn't save. Your text is still here, keep typing to retry.</>}
          </span>
        </div>

        <div className="pf-pager">
          {neighbours.prev ? <Link className="pf-btn" href={neighbours.prev.href}><ChevronLeft size={16} aria-hidden /> {neighbours.prev.title}</Link> : <span />}
          {neighbours.next ? <Link className="pf-btn pf-btn-primary" href={neighbours.next.href}>{neighbours.next.title} <ChevronRight size={16} aria-hidden /></Link> : <span />}
        </div>
      </div>

      <GuidancePanel guidance={guidance} optional={optional} custom={custom} exampleHref={exampleHref} onUsePrompt={usePrompt} />
    </div>
  );
}

function TitleInput({ value, onCommit }: { value: string; onCommit: (title: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.value = value;
  }, [value]);
  const commit = () => {
    const next = ref.current?.value.trim() ?? "";
    if (!next) {
      if (ref.current) ref.current.value = value;
      return;
    }
    if (next !== value) onCommit(next);
  };
  return (
    <input
      ref={ref}
      className="pf-title-input"
      defaultValue={value}
      aria-label="Title"
      maxLength={500}
      onBlur={commit}
      onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
    />
  );
}
