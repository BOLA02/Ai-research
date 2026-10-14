"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertCircle, BookMarked, Calculator, Check, ChevronLeft, ChevronRight, Image as ImageIcon, Loader2, Plus, Table2 } from "lucide-react";
import { api } from "@/lib/api";
import { useReportIndex } from "@/lib/workspace/hooks";
import { useWorkspace, type ContentTarget } from "@/lib/workspace/provider";
import { wordCount, type WritingItem } from "@/lib/workspace/outline";
import type { Guidance } from "@/lib/workspace/types";
import { CoachPanel } from "./coach-panel";
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
  /** Shown under the writing area, before the Previous and Next buttons. */
  after?: React.ReactNode;
  /** Pages other than chapter sections that the writing coach can read, such as the abstract. */
  coachable?: boolean;
};

export function Editor({ target, title, onRename, crumbs, content, guidance, optional, custom, exampleHref, placeholder, neighbours, banner, after, coachable }: Props) {
  const { project, sources, figures, tables, calculations, setContent, saveState, flushSaves } = useWorkspace();
  const { index } = useReportIndex();
  const area = useRef<HTMLTextAreaElement>(null);
  const caret = useRef<number | null>(null);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [preview, setPreview] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [menu, setMenu] = useState(false);
  const base = `/projects/${project?.id}`;

  // Grow the textarea with its content so the page scrolls instead of the box.
  useEffect(() => {
    const element = area.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.max(element.scrollHeight, 380)}px`;
  }, [content, target.id]);

  // After inserting a marker, put the cursor just after it.
  useLayoutEffect(() => {
    if (caret.current !== null && area.current) {
      area.current.focus();
      area.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  }, [content]);

  useEffect(() => setMode("write"), [target.id]);

  // Close the Insert menu when the writer clicks elsewhere.
  const toolbar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (event: MouseEvent) => !toolbar.current?.contains(event.target as Node) && setMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const insert = (marker: string, options: { ownLine?: boolean } = {}) => {
    const element = area.current;
    const start = element?.selectionStart ?? content.length;
    const end = element?.selectionEnd ?? content.length;
    const before = content.slice(0, start);
    const after = content.slice(end);
    // A calculation stands on a line of its own, so give it a blank line above and below.
    const lead = !options.ownLine || before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    const tail = !options.ownLine || after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
    const text = `${lead}${marker}${tail}`;
    caret.current = start + text.length;
    setContent(target, `${before}${text}${after}`);
    setMenu(false);
  };

  const showPreview = async () => {
    setMode("preview");
    setPreviewing(true);
    try {
      await flushSaves();
      const data = await api<{ text: string }>(`/projects/${project?.id}/report/resolve`, { method: "POST", body: JSON.stringify({ text: content }) });
      setPreview(data.text);
    } catch {
      setPreview(content);
    } finally {
      setPreviewing(false);
    }
  };

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

        <div className="pf-toolbar">
          <div role="tablist" aria-label="View" className="pf-seg">
            <button role="tab" aria-selected={mode === "write"} className={mode === "write" ? "on" : ""} onClick={() => setMode("write")}>Write</button>
            <button role="tab" aria-selected={mode === "preview"} className={mode === "preview" ? "on" : ""} onClick={showPreview}>Preview</button>
          </div>
          {mode === "write" && (
            <div ref={toolbar} style={{ position: "relative" }}>
              <button className="pf-btn pf-btn-sm" aria-haspopup="menu" aria-expanded={menu} onClick={() => { caret.current = null; setMenu(!menu); }}><Plus size={14} aria-hidden /> Insert</button>
              {menu && (
                <div className="pf-menu" role="menu" style={{ right: 0, top: 38 }} onKeyDown={(event) => event.key === "Escape" && setMenu(false)}>
                  <div className="hd"><BookMarked size={11} aria-hidden /> Citation</div>
                  {sources.length === 0 && <div style={{ padding: "6px 10px", fontSize: 13 }} className="pf-muted">No sources yet. <Link href={`${base}/references`}>Add one</Link></div>}
                  {sources.map((source) => <button key={source.id} role="menuitem" className="item" onClick={() => insert(`[@${source.citeKey}]`)}><strong>{source.citeKey}</strong><br /><span className="pf-muted" style={{ fontSize: 12 }}>{source.title}</span></button>)}
                  <div className="hd"><ImageIcon size={11} aria-hidden /> Figure</div>
                  {figures.length === 0 && <div style={{ padding: "6px 10px", fontSize: 13 }} className="pf-muted">No figures yet. <Link href={`${base}/figures`}>Add one</Link></div>}
                  {figures.map((figure) => <button key={figure.id} role="menuitem" className="item" onClick={() => insert(`[fig:${figure.label}]`)}>Figure {index?.figures.find((item) => item.id === figure.id)?.number ?? ""} <span className="pf-muted" style={{ fontSize: 12 }}>{figure.caption}</span></button>)}
                  <div className="hd"><Table2 size={11} aria-hidden /> Table</div>
                  {tables.length === 0 && <div style={{ padding: "6px 10px", fontSize: 13 }} className="pf-muted">No tables yet. <Link href={`${base}/tables`}>Add one</Link></div>}
                  {tables.map((table) => <button key={table.id} role="menuitem" className="item" onClick={() => insert(`[tab:${table.label}]`)}>Table {index?.tables.find((item) => item.id === table.id)?.number ?? ""} <span className="pf-muted" style={{ fontSize: 12 }}>{table.caption}</span></button>)}
                  <div className="hd"><Calculator size={11} aria-hidden /> Calculation</div>
                  {calculations.length === 0 && <div style={{ padding: "6px 10px", fontSize: 13 }} className="pf-muted">No calculations yet. <Link href={`${base}/calculations`}>Add one</Link></div>}
                  {calculations.map((calculation) => <button key={calculation.id} role="menuitem" className="item" onClick={() => insert(`[calc:${calculation.label}]`, { ownLine: true })}>{calculation.title}</button>)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pf-paper">
          {mode === "write" ? (
            <>
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
            </>
          ) : (
            <div className="pf-preview" aria-live="polite">
              {previewing ? <span className="pf-muted">Formatting your citations…</span> : preview || <span className="pf-muted">Nothing written yet.</span>}
            </div>
          )}
        </div>
        {mode === "preview" && <p className="pf-hint">This is how your citations, figure numbers and table numbers will read in your {index?.style ?? ""} report. Go back to <strong>Write</strong> to edit.</p>}

        <div className="pf-editor-foot">
          <span>{wordCount(content)} words</span>
          <span className={`pf-save ${saveState === "error" ? "error" : ""}`} role="status" aria-live="polite">
            {saveState === "saving" && <><Loader2 size={14} className="spin" aria-hidden /> Saving…</>}
            {saveState === "saved" && <><Check size={14} aria-hidden /> Saved</>}
            {saveState === "error" && <><AlertCircle size={14} aria-hidden /> Couldn't save. Your text is still here, keep typing to retry.</>}
          </span>
        </div>

        {after}

        <div className="pf-pager">
          {neighbours.prev ? <Link className="pf-btn" href={neighbours.prev.href}><ChevronLeft size={16} aria-hidden /> {neighbours.prev.title}</Link> : <span />}
          {neighbours.next ? <Link className="pf-btn pf-btn-primary" href={neighbours.next.href}>{neighbours.next.title} <ChevronRight size={16} aria-hidden /></Link> : <span />}
        </div>
      </div>

      <GuidancePanel
        guidance={guidance}
        optional={optional}
        custom={custom}
        exampleHref={exampleHref}
        onUsePrompt={usePrompt}
        extra={target.kind === "section" || coachable ? <CoachPanel target={{ kind: target.kind, id: target.id }} content={content} onUseQuestion={usePrompt} /> : null}
      />
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
