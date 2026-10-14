"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertCircle, AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, BookMarked, Calculator, Check, ChevronLeft, ChevronRight, Image as ImageIcon, Italic, List, ListOrdered, Loader2, Plus, Redo2, Table2, Underline, Undo2 } from "lucide-react";
import { api } from "@/lib/api";
import { useReportIndex } from "@/lib/workspace/hooks";
import { useWorkspace, type ContentTarget } from "@/lib/workspace/provider";
import { wordCount, type WritingItem } from "@/lib/workspace/outline";
import { alignmentAt, setAlignment, toggleList, type Align } from "@/lib/workspace/blocks";
import type { Guidance } from "@/lib/workspace/types";
import { CoachPanel } from "./coach-panel";
import { RichText } from "./formatted";
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
  placeholder: string;
  neighbours: { prev?: WritingItem; next?: WritingItem };
  banner?: React.ReactNode;
  /** Shown under the writing area, before the Previous and Next buttons. */
  after?: React.ReactNode;
  /** Pages other than chapter sections that the writing coach can read, such as the abstract. */
  coachable?: boolean;
};

export function Editor({ target, title, onRename, crumbs, content, guidance, optional, custom, placeholder, neighbours, banner, after, coachable }: Props) {
  const { project, sources, figures, tables, calculations, setContent, saveState, flushSaves } = useWorkspace();
  const { index } = useReportIndex();
  const area = useRef<HTMLTextAreaElement>(null);
  const caret = useRef<number | null>(null);
  const range = useRef<[number, number] | null>(null);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [preview, setPreview] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [menu, setMenu] = useState(false);
  const base = `/projects/${project?.id}`;

  // Undo and redo. Typing is grouped into steps, so one press undoes a burst of typing, not a letter.
  const past = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const lastEdit = useRef(0);
  const [steps, setSteps] = useState({ undo: 0, redo: 0 });
  const track = () => setSteps({ undo: past.current.length, redo: future.current.length });
  useEffect(() => {
    past.current = [];
    future.current = [];
    track();
  }, [target.id]);

  /** Every change the writer makes goes through here. */
  const commit = (next: string, options: { newStep?: boolean } = {}) => {
    if (next === content) return;
    const now = Date.now();
    if (options.newStep || now - lastEdit.current > 800 || past.current.length === 0) {
      past.current.push(content);
      if (past.current.length > 200) past.current.shift();
    }
    lastEdit.current = now;
    future.current = [];
    track();
    setContent(target, next);
  };

  const jump = (from: string[], to: string[]) => {
    const previous = from.pop();
    if (previous === undefined) return;
    to.push(content);
    lastEdit.current = 0;
    // Put the cursor where the text changed.
    let at = 0;
    while (at < content.length && at < previous.length && content[at] === previous[at]) at += 1;
    caret.current = Math.max(0, at + Math.max(0, previous.length - content.length));
    setContent(target, previous);
    track();
  };
  const undo = () => jump(past.current, future.current);
  const redo = () => jump(future.current, past.current);

  /** Wrap the selected text in a mark, or take the mark off if it is already there. */
  const emphasise = (mark: string) => {
    const element = area.current;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const chosen = content.slice(start, end);
    const wrapped = chosen.length >= mark.length * 2 && chosen.startsWith(mark) && chosen.endsWith(mark);
    const outside = content.slice(start - mark.length, start) === mark && content.slice(end, end + mark.length) === mark;
    if (wrapped) {
      const inner = chosen.slice(mark.length, -mark.length);
      range.current = [start, start + inner.length];
      commit(`${content.slice(0, start)}${inner}${content.slice(end)}`, { newStep: true });
    } else if (outside && chosen) {
      range.current = [start - mark.length, end - mark.length];
      commit(`${content.slice(0, start - mark.length)}${chosen}${content.slice(end + mark.length)}`, { newStep: true });
    } else if (chosen) {
      range.current = [start + mark.length, end + mark.length];
      commit(`${content.slice(0, start)}${mark}${chosen}${mark}${content.slice(end)}`, { newStep: true });
    } else {
      // Nothing selected: leave the cursor between the marks, ready to type.
      caret.current = start + mark.length;
      commit(`${content.slice(0, start)}${mark}${mark}${content.slice(end)}`, { newStep: true });
    }
  };

  /** Where the cursor is, so the toolbar can show which alignment applies there. */
  const [here, setHere] = useState<Align | undefined>(undefined);
  const looked = () => setHere(alignmentAt(content, area.current?.selectionStart ?? 0));
  useEffect(looked, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  const edit = (change: (text: string, from: number, to: number) => { text: string; from: number; to: number }) => {
    const element = area.current;
    if (!element) return;
    const result = change(content, element.selectionStart, element.selectionEnd);
    range.current = [result.from, result.to];
    commit(result.text, { newStep: true });
  };
  const align = (value: Align) => edit((text, from, to) => setAlignment(text, from, to, value));
  const list = (kind: "bullet" | "number") => edit((text, from, to) => toggleList(text, from, to, kind));

  const onKey = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    const key = event.key.toLowerCase();
    if (key === "z" && !event.shiftKey) { event.preventDefault(); undo(); }
    else if (key === "y" || (key === "z" && event.shiftKey)) { event.preventDefault(); redo(); }
    else if (key === "b") { event.preventDefault(); emphasise("**"); }
    else if (key === "i") { event.preventDefault(); emphasise("*"); }
    else if (key === "u") { event.preventDefault(); emphasise("++"); }
  };

  // Grow the textarea with its content so the page scrolls instead of the box.
  useEffect(() => {
    const element = area.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.max(element.scrollHeight, 380)}px`;
  }, [content, target.id]);

  // After inserting a marker, put the cursor just after it.
  useLayoutEffect(() => {
    if (range.current && area.current) {
      area.current.focus();
      area.current.setSelectionRange(range.current[0], range.current[1]);
      range.current = null;
      caret.current = null;
    } else if (caret.current !== null && area.current) {
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
    commit(`${before}${text}${after}`, { newStep: true });
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
    commit(`${content}${gap}${prompt}\n`, { newStep: true });
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
            <button data-tip="Type and edit your text" role="tab" aria-selected={mode === "write"} className={mode === "write" ? "on" : ""} onClick={() => setMode("write")}>Write</button>
            <button data-tip="See your citations, figure numbers and formatting as they will read" role="tab" aria-selected={mode === "preview"} className={mode === "preview" ? "on" : ""} onClick={showPreview}>Preview</button>
          </div>
          {mode === "write" && (
            <div className="pf-tools" role="toolbar" aria-label="Formatting">
              <button type="button" className="pf-icon-btn" onClick={undo} disabled={steps.undo === 0} aria-label="Undo" title="Undo (Ctrl+Z)"><Undo2 size={17} aria-hidden /></button>
              <button type="button" className="pf-icon-btn" onClick={redo} disabled={steps.redo === 0} aria-label="Redo" title="Redo (Ctrl+Y)"><Redo2 size={17} aria-hidden /></button>
              <span className="pf-tools-sep" aria-hidden />
              {([["left", AlignLeft, "Align left"], ["center", AlignCenter, "Centre"], ["right", AlignRight, "Align right"], ["justify", AlignJustify, "Justify (both edges)"]] as const).map(([value, Icon, label]) => (
                <button key={value} type="button" className={`pf-icon-btn ${here === value ? "on" : ""}`} aria-pressed={here === value} onMouseDown={(event) => event.preventDefault()} onClick={() => align(value)} aria-label={label} data-tip={`${label}: the paragraph or list item you're in`}><Icon size={17} aria-hidden /></button>
              ))}
              <button type="button" className="pf-icon-btn" onMouseDown={(event) => event.preventDefault()} onClick={() => list("bullet")} aria-label="Bulleted list" data-tip="Bulleted list (selected lines)"><List size={17} aria-hidden /></button>
              <button type="button" className="pf-icon-btn" onMouseDown={(event) => event.preventDefault()} onClick={() => list("number")} aria-label="Numbered list" data-tip="Numbered list (selected lines)"><ListOrdered size={17} aria-hidden /></button>
              <span className="pf-tools-sep" aria-hidden />
              <button type="button" className="pf-icon-btn" onMouseDown={(event) => event.preventDefault()} onClick={() => emphasise("**")} aria-label="Bold" title="Bold (Ctrl+B)"><Bold size={17} aria-hidden /></button>
              <button type="button" className="pf-icon-btn" onMouseDown={(event) => event.preventDefault()} onClick={() => emphasise("*")} aria-label="Italic" title="Italic (Ctrl+I)"><Italic size={17} aria-hidden /></button>
              <button type="button" className="pf-icon-btn" onMouseDown={(event) => event.preventDefault()} onClick={() => emphasise("++")} aria-label="Underline" title="Underline (Ctrl+U)"><Underline size={17} aria-hidden /></button>
            </div>
          )}
          {mode === "write" && (
            <div ref={toolbar} style={{ position: "relative" }}>
              <button data-tip="Add a citation, figure, table or calculation to your text" className="pf-btn pf-btn-sm" aria-haspopup="menu" aria-expanded={menu} onClick={() => { caret.current = null; setMenu(!menu); }}><Plus size={14} aria-hidden /> Insert</button>
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

        <div className="pf-paper" data-tour="paper">
          {mode === "write" ? (
            <>
              <label className="sr-only" htmlFor="body" style={{ position: "absolute", left: -9999 }}>{title}</label>
              <textarea
                id="body"
                ref={area}
                className="pf-textarea"
                value={content}
                placeholder={placeholder}
                onChange={(event) => commit(event.target.value)}
                onKeyDown={onKey}
                onSelect={looked}
                spellCheck
              />
            </>
          ) : (
            <div className="pf-preview" aria-live="polite">
              {previewing ? <span className="pf-muted">Formatting your citations…</span> : preview ? <RichText text={preview} /> : <span className="pf-muted">Nothing written yet.</span>}
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
