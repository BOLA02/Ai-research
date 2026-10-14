"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Copy, ImagePlus, Plus, Trash2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace/provider";
import { useReportIndex, useSectionOptions } from "@/lib/workspace/hooks";
import type { ApiFigure } from "@/lib/workspace/types";

const MAX_BYTES = 3 * 1024 * 1024;

function FigureCard({ figure, number }: { figure: ApiFigure; number?: number }) {
  const { project, updateFigure, uploadFigureImage, removeFigureImage, deleteFigure } = useWorkspace();
  const sections = useSectionOptions();
  const [caption, setCaption] = useState(figure.caption);
  const [note, setNote] = useState(figure.sourceNote ?? "");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [version, setVersion] = useState(0);
  const file = useRef<HTMLInputElement>(null);

  const upload = async (chosen?: File) => {
    if (!chosen) return;
    setError("");
    if (!["image/png", "image/jpeg"].includes(chosen.type)) return setError("Use a PNG or JPEG image.");
    if (chosen.size > MAX_BYTES) return setError("Images can be up to 3 MB.");
    try {
      await uploadFigureImage(figure.id, chosen);
      setVersion((current) => current + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Couldn't upload the image.");
    }
  };

  const copy = async () => {
    await navigator.clipboard?.writeText(`[fig:${figure.label}]`).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <li className="pf-card" style={{ padding: 18, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <strong style={{ fontSize: 17 }}>{number ? `Figure ${number}` : "Figure"}</strong>
        <div style={{ display: "flex", gap: 2 }}>
          <button className="pf-btn pf-btn-sm" onClick={copy} title="Copy the marker to mention this figure in your text">{copied ? <Check size={14} /> : <Copy size={14} />} <code style={{ background: "none" }}>[fig:{figure.label}]</code></button>
          <button className="pf-icon-btn" aria-label={`Delete figure ${figure.caption}`} onClick={() => window.confirm(`Delete "${figure.caption}"?`) && void deleteFigure(figure.id)}><Trash2 size={16} /></button>
        </div>
      </div>

      {figure.hasImage ? (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pf-thumb" alt={figure.altText || figure.caption} src={`${API_BASE_URL}/projects/${project?.id}/figures/${figure.id}/image?v=${version}`} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="pf-btn pf-btn-sm" onClick={() => file.current?.click()}>Replace image</button>
            <button className="pf-btn pf-btn-sm" onClick={() => void removeFigureImage(figure.id)}>Remove image</button>
          </div>
        </div>
      ) : (
        <button type="button" className="pf-drop" onClick={() => file.current?.click()} style={{ cursor: "pointer", background: "transparent" }}>
          <ImagePlus size={22} aria-hidden />
          <span>Add the image<br /><small>PNG or JPEG, up to 3 MB</small></span>
        </button>
      )}
      <input ref={file} type="file" accept="image/png,image/jpeg" hidden onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
      {error && <div className="pf-alert" role="alert">{error}</div>}

      <div>
        <label className="pf-label" htmlFor={`cap-${figure.id}`}>Caption</label>
        <input id={`cap-${figure.id}`} className="pf-input" value={caption} maxLength={1000} onChange={(event) => setCaption(event.target.value)} onBlur={() => caption.trim() && caption !== figure.caption && void updateFigure(figure.id, { caption: caption.trim() })} />
        <p className="pf-hint">The number is added for you. Write only the title, such as "Block diagram of the system".</p>
      </div>

      <div>
        <label className="pf-label" htmlFor={`sec-${figure.id}`}>Which section is it in?</label>
        <select id={`sec-${figure.id}`} className="pf-input" value={figure.sectionId ?? ""} onChange={(event) => void updateFigure(figure.id, { sectionId: event.target.value || null })}>
          <option value="">Not placed yet</option>
          {sections.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
        </select>
      </div>

      <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
        <input type="checkbox" checked={figure.isOriginal} onChange={(event) => void updateFigure(figure.id, { isOriginal: event.target.checked })} /> I made this figure myself
      </label>
      {!figure.isOriginal && (
        <div>
          <label className="pf-label" htmlFor={`src-${figure.id}`}>Source</label>
          <input id={`src-${figure.id}`} className="pf-input" value={note} placeholder="e.g. Adapted from [@glover2009]" onChange={(event) => setNote(event.target.value)} onBlur={() => note !== (figure.sourceNote ?? "") && void updateFigure(figure.id, { sourceNote: note.trim() || null })} />
          <p className="pf-hint">Your department requires every imported figure to be cited. You can use a citation marker here.</p>
        </div>
      )}
    </li>
  );
}

export function FiguresPage() {
  const { figures, createFigure } = useWorkspace();
  const { index } = useReportIndex();
  const sections = useSectionOptions();
  const params = useSearchParams();
  const [caption, setCaption] = useState("");
  const [sectionId, setSectionId] = useState(params.get("section") ?? "");
  const [busy, setBusy] = useState(false);

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!caption.trim()) return;
    setBusy(true);
    try {
      await createFigure({ caption: caption.trim(), sectionId: sectionId || null });
      setCaption("");
    } finally {
      setBusy(false);
    }
  };

  const numbered = [...figures].sort((a, b) => (index?.figures.find((item) => item.id === a.id)?.number ?? 999) - (index?.figures.find((item) => item.id === b.id)?.number ?? 999));

  return (
    <div className="pf-section" style={{ maxWidth: 900 }}>
      <div className="pf-eyebrow">Tools</div>
      <h1 style={{ margin: "0 0 6px", fontSize: 28 }}>Figures</h1>
      <p className="pf-lede" style={{ marginBottom: 20 }}>Figures are numbered 1, 2, 3 in the order they appear in your report, and the numbers update by themselves if you move things around. Mention a figure in your text with its marker, for example <code>[fig:block-diagram]</code>.</p>

      <form onSubmit={add} className="pf-card" style={{ padding: 16, marginBottom: 20 }}>
        <div className="pf-label">Add a figure</div>
        <div className="pf-inline-form" style={{ marginTop: 0, flexWrap: "wrap" }}>
          <input className="pf-input" style={{ flex: "1 1 240px" }} aria-label="Figure caption" placeholder="Caption, e.g. Block diagram of the system" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={1000} />
          <select className="pf-input" style={{ flex: "0 1 240px" }} aria-label="Section" value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
            <option value="">Choose the section later</option>
            {sections.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
          </select>
          <button className="pf-btn pf-btn-primary" disabled={busy || !caption.trim()}><Plus size={16} aria-hidden /> Add</button>
        </div>
      </form>

      {figures.length === 0 ? (
        <div className="pf-empty"><h3>No figures yet</h3><p className="pf-muted">Circuit diagrams, photos and charts go here.</p></div>
      ) : (
        <ul className="pf-list" style={{ gap: 16 }}>{numbered.map((figure) => <FigureCard key={figure.id} figure={figure} number={index?.figures.find((item) => item.id === figure.id)?.number} />)}</ul>
      )}
    </div>
  );
}
