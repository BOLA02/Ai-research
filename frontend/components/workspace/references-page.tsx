"use client";

import { useState } from "react";
import { BookMarked, Check, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useWorkspace } from "@/lib/workspace/provider";
import { useReportIndex } from "@/lib/workspace/hooks";
import { normaliseStyle } from "@/lib/workspace/style";
import type { ApiSource, ReferenceStyle } from "@/lib/workspace/types";
import { Formatted } from "./formatted";
import { SOURCE_TYPES, SourceForm } from "./source-form";

const STYLE_HELP: Record<ReferenceStyle, string> = {
  IEEE: "Numbered style. Citations look like [1] and the list is in the order you cite. Your department uses it for electrical, electronic and computing projects.",
  APA: "Author-date style. Citations look like (Smith, 2010) and the list is in alphabetical order. For three or more authors, the citation shows the first author and et al.",
};

export function ReferencesPage() {
  const { project, sources, createSource, updateSource, deleteSource, setReferenceStyle } = useWorkspace();
  const { index } = useReportIndex();
  const [mode, setMode] = useState<"list" | "new" | { edit: ApiSource }>("list");
  const [copied, setCopied] = useState("");
  const [switching, setSwitching] = useState(false);
  if (!project) return null;

  const style = normaliseStyle(project.referenceStyle);
  const entryFor = (id: string) => index?.sources.find((entry) => entry.id === id);
  const ordered = index ? index.sources.map((entry) => sources.find((source) => source.id === entry.id)).filter((source): source is ApiSource => !!source) : sources;

  const copy = async (key: string) => {
    await navigator.clipboard?.writeText(`[@${key}]`).catch(() => undefined);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  };

  const changeStyle = async (next: ReferenceStyle) => {
    if (next === style) return;
    setSwitching(true);
    try {
      await setReferenceStyle(next);
    } finally {
      setSwitching(false);
    }
  };

  const remove = async (source: ApiSource) => {
    const entry = entryFor(source.id);
    const warning = entry && entry.citationCount > 0 ? ` It is cited ${entry.citationCount} time${entry.citationCount === 1 ? "" : "s"}, and those citations will break.` : "";
    if (window.confirm(`Delete "${source.title}"?${warning}`)) await deleteSource(source.id);
  };

  return (
    <div className="pf-section" style={{ maxWidth: 900 }}>
      <div className="pf-eyebrow">Tools</div>
      <div className="pf-page-head" style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>References</h1>
        {mode === "list" && <button className="pf-btn pf-btn-primary" onClick={() => setMode("new")}><Plus size={16} aria-hidden /> Add source</button>}
      </div>

      <div className="pf-card" style={{ padding: 16, marginBottom: 20 }}>
        <div className="pf-label" id="style-label">Reference style</div>
        <div role="radiogroup" aria-labelledby="style-label" className="pf-seg">
          {(["IEEE", "APA"] as const).map((option) => (
            <button key={option} role="radio" aria-checked={style === option} className={style === option ? "on" : ""} onClick={() => changeStyle(option)} disabled={switching}>{option}</button>
          ))}
        </div>
        <p className="pf-hint">{STYLE_HELP[style]} You can switch at any time. Your sources stay the same and every citation and the list reformat.</p>
      </div>

      {mode === "new" && <SourceForm onCancel={() => setMode("list")} onSave={async (input) => { await createSource(input); setMode("list"); }} />}
      {typeof mode === "object" && <SourceForm initial={mode.edit} onCancel={() => setMode("list")} onSave={async (input) => { await updateSource(mode.edit.id, input); setMode("list"); }} />}

      {mode === "list" && sources.length === 0 && (
        <div className="pf-empty">
          <BookMarked size={28} aria-hidden color="var(--pf-brand)" />
          <h3>No sources yet</h3>
          <p className="pf-muted" style={{ maxWidth: 440 }}>Add each book, paper or website you read. Then, while writing, press <strong>Insert › Citation</strong> to cite it. The list below builds itself.</p>
          <button className="pf-btn pf-btn-primary" onClick={() => setMode("new")}>Add your first source</button>
        </div>
      )}

      {mode === "list" && sources.length > 0 && (
        <ol className="pf-list" aria-label="Reference list">
          {ordered.map((source) => {
            const entry = entryFor(source.id);
            return (
              <li key={source.id} className="pf-row" style={{ alignItems: "flex-start" }}>
                {style === "IEEE" && <span className="pf-refnum" aria-label={entry?.number ? `Reference ${entry.number}` : "Not numbered yet"}>{entry?.number ? `[${entry.number}]` : "[ ]"}</span>}
                <div className="grow" style={{ fontFamily: "var(--pf-serif)", fontSize: 15.5, lineHeight: 1.55 }}>
                  {entry ? <Formatted text={entry.formatted} /> : source.title}
                  <small style={{ fontFamily: "var(--pf-sans)", marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span className="pf-tag">{SOURCE_TYPES[source.type].label}</span>
                    {entry && entry.citationCount === 0 && <span className="pf-tag pf-tag-accent">Not cited yet</span>}
                    {entry && entry.citationCount > 0 && <span className="pf-tag pf-tag-brand">Cited {entry.citationCount}×</span>}
                    <code>[@{source.citeKey}]</code>
                  </small>
                </div>
                <div style={{ display: "flex", gap: 2, flex: "none" }}>
                  <button className="pf-icon-btn" onClick={() => copy(source.citeKey)} aria-label={`Copy citation marker for ${source.title}`} title="Copy citation marker">{copied === source.citeKey ? <Check size={16} /> : <Copy size={16} />}</button>
                  <button className="pf-icon-btn" onClick={() => setMode({ edit: source })} aria-label={`Edit ${source.title}`}><Pencil size={16} /></button>
                  <button className="pf-icon-btn" onClick={() => remove(source)} aria-label={`Delete ${source.title}`}><Trash2 size={16} /></button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
