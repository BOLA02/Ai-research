"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Cpu, Wrench } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Template, TemplateSummary } from "@/lib/workspace/types";

const copy: Record<TemplateSummary["projectType"], { icon: typeof Cpu; summary: string; points: string[] }> = {
  DESIGN: {
    icon: Cpu,
    summary: "You design, build and test a circuit, device or system.",
    points: [
      "Six chapters, from Introduction to Conclusions",
      "Design Methodology with calculations and simulation",
      "Construction and Packaging, then Testing and Result",
    ],
  },
  MAINTENANCE: {
    icon: Wrench,
    summary: "You find faults in existing equipment and repair or maintain it.",
    points: [
      "Introduction, a maintenance Literature Review, and Trouble Shooting and Remedy",
      "Chapters 4 to 6 are yours: you name them and add the sections",
    ],
  },
};

export function NewProjectWizard() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState<Template | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ templates: TemplateSummary[] }>("/templates")
      .then((data) => {
        setTemplates(data.templates);
        setTemplateId(data.templates[0]?.id ?? "");
      })
      .catch(() => setError("We couldn't load the project templates. Refresh and try again."));
  }, []);

  useEffect(() => {
    if (!templateId) return;
    api<{ template: Template }>(`/templates/${templateId}`).then((data) => setDetail(data.template)).catch(() => setDetail(null));
  }, [templateId]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Give your project a title. You can change it later.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await api<{ project: { id: string } }>("/projects", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), templateId }),
      });
      router.push(`/projects/${data.project.id}`);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Something went wrong creating the project.");
      setBusy(false);
    }
  };

  const chosen = templates.find((template) => template.id === templateId);

  return (
    <main className="pf-page">
      <div className="pf-page-head">
        <div>
          <div className="pf-eyebrow">New project</div>
          <h1>{step === 1 ? "What kind of project is it?" : "Name your project"}</h1>
          <p className="pf-lede">
            {step === 1
              ? "This sets up the pages and chapters your department expects. You can rename or add to them later."
              : "Use the working title for now. Your title must match on the cover, abstract and approval pages, so you can refine it as you go."}
          </p>
        </div>
      </div>

      <div className="pf-steps" aria-label="Progress">
        <span className={step === 1 ? "on" : ""}>1 Project type</span>
        <span className={step === 2 ? "on" : ""}>2 Title</span>
      </div>

      {error && <div className="pf-alert" role="alert" style={{ marginBottom: 16 }}>{error}</div>}

      {step === 1 && (
        <>
          <div className="pf-type-grid">
            {templates.map((template) => {
              const info = copy[template.projectType];
              const Icon = info.icon;
              return (
                <button key={template.id} type="button" className="pf-type" aria-pressed={templateId === template.id} onClick={() => setTemplateId(template.id)}>
                  <Icon size={24} aria-hidden color="var(--pf-brand)" />
                  <h3>{template.projectType === "DESIGN" ? "Design and construction" : "Maintenance and repair"}</h3>
                  <p style={{ margin: 0, color: "var(--pf-ink-soft)" }}>{info.summary}</p>
                  <ul>{info.points.map((point) => <li key={point}>{point}</li>)}</ul>
                </button>
              );
            })}
          </div>
          <div className="pf-actions" style={{ marginTop: 24 }}>
            <button className="pf-btn pf-btn-primary" disabled={!templateId} onClick={() => setStep(2)}>
              Continue <ArrowRight size={16} aria-hidden />
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <form className="pf-form" onSubmit={create}>
          <div>
            <label className="pf-label" htmlFor="title">Project title</label>
            <input id="title" className="pf-input" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={500} autoFocus placeholder="e.g. Design and Construction of a 5 kVA Inverter" />
            <p className="pf-hint">Keep it under 12 words if you can. Up to 20 is fine to make it explicit.</p>
          </div>
          {chosen && (
            <div className="pf-card" style={{ padding: 16 }}>
              <div className="pf-label">Your report will follow</div>
              <dl className="pf-facts">
                <div><dt>Institution</dt><dd>{chosen.institution}</dd></div>
                <div><dt>Department</dt><dd>{chosen.department}</dd></div>
                <div><dt>Programme</dt><dd>{chosen.programme}</dd></div>
                {detail && <div><dt>Chapters</dt><dd>{detail.chapters.length}</dd></div>}
                {detail && <div><dt>Referencing</dt><dd>{detail.referenceStyle}</dd></div>}
              </dl>
            </div>
          )}
          <div className="pf-actions">
            <button type="button" className="pf-btn" onClick={() => setStep(1)}><ArrowLeft size={16} aria-hidden /> Back</button>
            <button className="pf-btn pf-btn-primary" disabled={busy}>
              <Check size={16} aria-hidden /> {busy ? "Creating…" : "Create project"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
