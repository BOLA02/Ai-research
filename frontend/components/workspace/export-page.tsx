"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Download, FileText } from "lucide-react";
import { API_BASE_URL, api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace/provider";
import type { Check } from "@/lib/workspace/types";
import { ToolGuide } from "./tool-guide";

export function ExportPage() {
  const { project, template, flushSaves } = useWorkspace();
  const [counts, setCounts] = useState<{ error: number; warning: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const projectId = project?.id;

  useEffect(() => {
    if (!projectId) return;
    let active = true;
    (async () => {
      try {
        await flushSaves();
        const data = await api<{ checks: Check[] }>(`/projects/${projectId}/report/checks`);
        if (active) setCounts({ error: data.checks.filter((c) => c.severity === "error").length, warning: data.checks.filter((c) => c.severity === "warning").length });
      } catch {
        if (active) setCounts(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [projectId, flushSaves]);

  if (!project) return null;
  const format = template?.format;
  const base = `/projects/${project.id}`;

  const download = async () => {
    setBusy(true);
    setError("");
    try {
      await flushSaves();
      const response = await fetch(`${API_BASE_URL}${base}/export/docx`, { credentials: "include" });
      if (!response.ok) throw new Error("The export failed.");
      const blob = await response.blob();
      const link = document.createElement("a");
      const name = project.title.replace(/[^A-Za-z0-9 _-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80) || "project-report";
      link.href = URL.createObjectURL(blob);
      link.download = `${name}.docx`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      setError("We couldn't create the document. Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pf-section" style={{ maxWidth: 760 }}>
      <div className="pf-eyebrow">Tools</div>
      <h1 style={{ margin: "0 0 6px", fontSize: 28 }}>Export</h1>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}><ToolGuide id="export" label="Export" steps={[{ target: "intro", placement: "bottom", title: "Your Word document", body: <p>The download is already set up the way your department asks: page size, margins, font, spacing, page numbers and the table of contents.</p> }, { target: "add", placement: "bottom", title: "Download it", body: <p>Press Download. Open it in Word and, if asked, choose to update the fields so the table of contents shows the right page numbers.</p> }]} /></div>
      <p data-tour="intro" className="pf-lede" style={{ marginBottom: 20 }}>Download your report as a Word document, already set up the way your department asks. You can keep editing it in Word.</p>

      <section className="pf-card" style={{ padding: 20, display: "grid", gap: 14 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <FileText size={30} aria-hidden color="var(--pf-brand)" />
          <div style={{ flex: "1 1 260px" }}>
            <strong style={{ display: "block" }}>{project.title}</strong>
            <span className="pf-muted" style={{ fontSize: 14 }}>Word document (.docx), {project.referenceStyle ?? "IEEE"} referencing</span>
          </div>
          <button data-tour="add" className="pf-btn pf-btn-primary" onClick={download} disabled={busy}><Download size={16} aria-hidden /> {busy ? "Preparing…" : "Download Word document"}</button>
        </div>
        {error && <div className="pf-alert" role="alert">{error}</div>}

        {counts && (
          <div role="status" style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 12, borderRadius: 8, background: counts.error ? "var(--pf-danger-soft)" : counts.warning ? "var(--pf-accent-soft)" : "var(--pf-brand-soft)", fontSize: 14, lineHeight: 1.5 }}>
            {counts.error ? <AlertCircle size={18} aria-hidden color="var(--pf-danger)" /> : counts.warning ? <AlertTriangle size={18} aria-hidden color="var(--pf-accent)" /> : <CheckCircle2 size={18} aria-hidden color="var(--pf-brand)" />}
            <span>
              {counts.error || counts.warning ? (
                <>Your report has {counts.error ? `${counts.error} problem${counts.error === 1 ? "" : "s"} to fix` : ""}{counts.error && counts.warning ? " and " : ""}{counts.warning ? `${counts.warning} thing${counts.warning === 1 ? "" : "s"} worth fixing` : ""}. You can still export a draft. <Link href={`${base}/validation`}>See the checks</Link>.</>
              ) : (
                <>The checks found nothing to fix.</>
              )}
            </span>
          </div>
        )}
      </section>

      <div className="pf-two">
        <section className="pf-card">
          <h3>What the document contains</h3>
          <ul className="pf-tips" style={{ lineHeight: 1.6 }}>
            <li>Cover page, fly leaf and title page</li>
            <li>Declaration and approval page, filled from your <Link href={`${base}/details`}>project details</Link></li>
            <li>Table of contents, lists of figures and tables</li>
            <li>Every chapter, with your figures and tables numbered</li>
            <li>References and any appendices</li>
          </ul>
        </section>
        {format && (
          <section className="pf-card">
            <h3>Formatting applied for you</h3>
            <dl className="pf-facts">
              <div><dt>Paper</dt><dd>A4</dd></div>
              <div><dt>Font</dt><dd>{format.fontFamily}, {format.fontSizePt} pt</dd></div>
              <div><dt>Spacing</dt><dd>{format.bodyLineSpacing} lines</dd></div>
              <div><dt>Text</dt><dd>{format.justified ? "Justified" : "Left-aligned"}</dd></div>
              <div><dt>Margins</dt><dd>L {format.marginsMm.left} · others {format.marginsMm.top} mm</dd></div>
              <div><dt>Page numbers</dt><dd>Top right, roman then 1, 2, 3</dd></div>
            </dl>
          </section>
        )}
      </div>

      <section className="pf-callout" style={{ marginTop: 20 }}>
        <AlertTriangle size={18} aria-hidden style={{ flex: "none", marginTop: 2 }} />
        <span><strong>When you open it in Word</strong>, choose <strong>Yes</strong> if Word asks to update fields. That fills in the page numbers in the table of contents and lists. Then check the hard-copy details your department asks for: the crest on the cover, dark-blue hard binding and your name, level, department and year on the spine.</span>
      </section>
    </div>
  );
}
