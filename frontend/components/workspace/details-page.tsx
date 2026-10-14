"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/workspace/provider";
import type { ApiProject } from "@/lib/workspace/types";
import { ToolGuide } from "./tool-guide";

type Draft = Record<"studentName" | "registrationNumber" | "supervisorNames" | "coordinatorName" | "hodName" | "externalExaminerName" | "school" | "college" | "graduationYear", string>;

const FIELDS: { name: keyof Draft; label: string; hint?: string; wide?: boolean }[] = [
  { name: "studentName", label: "Your full name", hint: "As it should appear on the cover, in capitals." },
  { name: "registrationNumber", label: "Registration number", hint: "For example KPT/COE/EEE/24/0000." },
  { name: "supervisorNames", label: "Project supervisor(s)", hint: "Full names and titles. Separate two supervisors with a comma.", wide: true },
  { name: "coordinatorName", label: "Project coordinator" },
  { name: "hodName", label: "Head of department" },
  { name: "externalExaminerName", label: "External examiner", hint: "Leave blank until you know who it is." },
  { name: "school", label: "School", hint: "Optional. It appears on the cover if you fill it in." },
  { name: "college", label: "College", hint: "For example College of Engineering." },
  { name: "graduationYear", label: "Year of graduation", hint: "Use the semester you will graduate in." },
];

const toDraft = (project: ApiProject, suggestion: string): Draft => ({
  studentName: project.studentName ?? suggestion,
  registrationNumber: project.registrationNumber ?? "",
  supervisorNames: project.supervisorNames ?? "",
  coordinatorName: project.coordinatorName ?? "",
  hodName: project.hodName ?? "",
  externalExaminerName: project.externalExaminerName ?? "",
  school: project.school ?? "",
  college: project.college ?? "",
  graduationYear: String(project.graduationYear ?? new Date().getFullYear()),
});

export function DetailsPage() {
  const { project, updateProject } = useWorkspace();
  const { user } = useAuth();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!project) return null;

  const value = draft ?? toDraft(project, user ? `${user.firstName} ${user.lastName}` : "");
  const set = (name: keyof Draft, next: string) => {
    setSaved(false);
    setDraft({ ...value, [name]: next });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const year = Number(value.graduationYear);
    if (value.graduationYear && (!Number.isInteger(year) || year < 1990 || year > 2100)) return setError("Enter the year as four digits, for example 2026.");
    setBusy(true);
    setError("");
    try {
      await updateProject({ ...value, graduationYear: value.graduationYear ? year : null });
      setDraft(null);
      setSaved(true);
    } catch {
      setError("We couldn't save your details. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pf-section" style={{ maxWidth: 760 }}>
      <div className="pf-eyebrow">Tools</div>
      <h1 style={{ margin: "0 0 6px", fontSize: 28 }}>Project details</h1>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}><ToolGuide id="details" label="Project details" steps={[{ target: "intro", placement: "bottom", title: "Type these once", body: <p>Your name, registration number, supervisor and the rest appear on the cover, title page, declaration and approval page.</p> }, { target: "add", placement: "bottom", title: "Fill in the form", body: <p>Names are printed exactly as you type them here. Leave the examiner blank until you know who it is, then press Save details.</p> }]} /></div>
      <p data-tour="intro" className="pf-lede" style={{ marginBottom: 20 }}>These fill in your cover page, title page, declaration and approval page, so you type them once. Names are printed exactly as you write them here.</p>

      <form data-tour="add" onSubmit={save} className="pf-card" style={{ padding: 20, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {FIELDS.map((field) => (
          <div key={field.name} style={field.wide ? { gridColumn: "1 / -1" } : undefined}>
            <label className="pf-label" htmlFor={field.name}>{field.label}</label>
            <input id={field.name} className="pf-input" value={value[field.name]} onChange={(event) => set(field.name, event.target.value)} inputMode={field.name === "graduationYear" ? "numeric" : undefined} maxLength={500} />
            {field.hint && <p className="pf-hint">{field.hint}</p>}
          </div>
        ))}
        {error && <div className="pf-alert" role="alert" style={{ gridColumn: "1 / -1" }}>{error}</div>}
        <div className="pf-actions" style={{ gridColumn: "1 / -1", margin: 0, alignItems: "center" }}>
          <button className="pf-btn pf-btn-primary" disabled={busy}>{busy ? "Saving…" : "Save details"}</button>
          {saved && <span role="status" style={{ display: "inline-flex", gap: 6, alignItems: "center", color: "var(--pf-brand-strong)", fontWeight: 600 }}><Check size={16} aria-hidden /> Saved</span>}
        </div>
      </form>
    </div>
  );
}
