"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace/provider";
import type { Check, CheckLink, Severity } from "@/lib/workspace/types";
import { ToolGuide } from "./tool-guide";

const icons: Record<Severity, typeof Info> = { error: AlertCircle, warning: AlertTriangle, info: Info, ok: CheckCircle2 };
const heading: Record<Severity, string> = { error: "Fix before you submit", warning: "Worth fixing", info: "Good to know", ok: "Looking good" };

export function ChecksPage() {
  const { project, flushSaves } = useWorkspace();
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const projectId = project?.id;

  const run = useCallback(async () => {
    if (!projectId) return;
    setBusy(true);
    setError("");
    try {
      await flushSaves();
      const data = await api<{ checks: Check[] }>(`/projects/${projectId}/report/checks?track=1`);
      setChecks(data.checks);
    } catch {
      setError("We couldn't run the checks. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }, [projectId, flushSaves]);

  useEffect(() => {
    void run();
  }, [run]);

  const href = (link?: CheckLink) => {
    if (!link || !projectId) return null;
    const base = `/projects/${projectId}`;
    if (link.kind === "section") return `${base}/section/${link.id}`;
    if (link.kind === "document") return `${base}/page/${link.id}`;
    return `${base}/${link.tool}`;
  };

  const groups = (["error", "warning", "info", "ok"] as Severity[]).map((severity) => ({ severity, items: (checks ?? []).filter((check) => check.severity === severity) })).filter((group) => group.items.length);

  return (
    <div className="pf-section" style={{ maxWidth: 820 }}>
      <div className="pf-eyebrow">Tools</div>
      <div className="pf-page-head" style={{ marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Checks</h1>
        <button data-tour="add" className="pf-btn" onClick={run} disabled={busy}><RefreshCw size={15} className={busy ? "spin" : ""} aria-hidden /> Check again</button>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}><ToolGuide id="checks" label="Checks" steps={[{ target: "intro", placement: "bottom", title: "Checks", body: <p>These compare your report with your department's guidelines. They are a guide, not a mark.</p> }, { target: "add", placement: "bottom", title: "Check again", body: <p>Press this after you make changes to see what is fixed and what is left.</p> }, { target: "results", placement: "top", title: "What to fix first", body: <p>Errors come first, then warnings. Tap a result to jump to the place that needs work.</p> }]} /></div>
      <p data-tour="intro" className="pf-lede" style={{ marginBottom: 20 }}>These checks compare your report with your department's guidelines. They're a guide, not a mark, and they run on what you've written so far.</p>

      {error && <div className="pf-alert" role="alert">{error}</div>}
      {!checks && !error && <p className="pf-muted" role="status">Checking your report…</p>}

      {groups.map(({ severity, items }) => {
        const Icon = icons[severity];
        return (
          <section key={severity} data-tour={items.length ? "results" : undefined} aria-label={heading[severity]} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--pf-muted)", margin: "0 0 10px" }}>{heading[severity]} ({items.length})</h2>
            <ul className="pf-list">
              {items.map((check) => {
                const target = href(check.link);
                return (
                  <li key={check.id} className={`pf-check ${severity}`}>
                    <Icon className="icon" size={19} aria-hidden />
                    <div style={{ flex: 1 }}>
                      <h3>{check.title}</h3>
                      {check.detail && <p>{check.detail}</p>}
                    </div>
                    {target && severity !== "ok" && <Link className="pf-btn pf-btn-sm" href={target} style={{ alignSelf: "center" }}>Go there</Link>}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
