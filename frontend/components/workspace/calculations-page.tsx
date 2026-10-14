"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Check, Copy, Plus, Trash2 } from "lucide-react";
import { useWorkspace } from "@/lib/workspace/provider";
import { useSectionOptions } from "@/lib/workspace/hooks";
import { CALC_PRESETS, type CalcPreset } from "@/lib/workspace/calc-presets";
import type { ApiCalculation, CalcResult, CalcStep, CalcVariable } from "@/lib/workspace/types";

/** Shows subscripts the way the report will: V_pk becomes V with a lowered pk. */
export function Working({ line }: { line: string }) {
  const parts = line.split(/(_[\p{L}\p{N}]+)/gu).filter(Boolean);
  return <>{parts.map((part, index) => (part.startsWith("_") && part.length > 1 ? <sub key={index}>{part.slice(1)}</sub> : <span key={index}>{part}</span>))}</>;
}

const blankVariable = (): CalcVariable => ({ symbol: "", value: "", unit: "" });
const blankStep = (): CalcStep => ({ symbol: "", expression: "", unit: "" });

function CalculationCard({ calculation, startOpen }: { calculation: ApiCalculation; startOpen: boolean }) {
  const { updateCalculation, deleteCalculation, previewCalculation } = useWorkspace();
  const sections = useSectionOptions();
  const [title, setTitle] = useState(calculation.title);
  const [variables, setVariables] = useState(calculation.variables);
  const [steps, setSteps] = useState(calculation.steps);
  const [note, setNote] = useState(calculation.note ?? "");
  const [result, setResult] = useState<CalcResult>(calculation.result);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const card = useRef<HTMLLIElement>(null);

  const dirty = JSON.stringify([variables, steps, note]) !== JSON.stringify([calculation.variables, calculation.steps, calculation.note ?? ""]);

  // Work out the draft as it is typed, a moment after the last key press.
  useEffect(() => {
    if (!dirty) {
      setResult(calculation.result);
      return;
    }
    let live = true;
    const timer = setTimeout(() => {
      previewCalculation({ variables, steps, note: note || null })
        .then((next) => live && setResult(next))
        .catch(() => undefined);
    }, 400);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [variables, steps, note, dirty, calculation.result, previewCalculation]);

  useEffect(() => {
    if (startOpen) card.current?.scrollIntoView({ block: "center" });
  }, [startOpen]);

  const setVariable = (index: number, patch: Partial<CalcVariable>) => setVariables(variables.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const setStep = (index: number, patch: Partial<CalcStep>) => setSteps(steps.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await updateCalculation(calculation.id, { variables, steps, note: note.trim() || null });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Couldn't save this calculation.");
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard?.writeText(`[calc:${calculation.label}]`).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <li ref={card} className="pf-card" style={{ padding: 18, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input className="pf-title-input" style={{ fontSize: 20, margin: 0, flex: "1 1 240px" }} aria-label="Calculation title" value={title} maxLength={300} onChange={(event) => setTitle(event.target.value)} onBlur={() => title.trim() && title !== calculation.title && void updateCalculation(calculation.id, { title: title.trim() })} />
        <div style={{ display: "flex", gap: 2 }}>
          <button className="pf-btn pf-btn-sm" onClick={copy} title="Copy the marker, then paste it on its own line where the working should appear">{copied ? <Check size={14} /> : <Copy size={14} />} <code style={{ background: "none" }}>[calc:{calculation.label}]</code></button>
          <button className="pf-icon-btn" aria-label={`Delete ${calculation.title}`} onClick={() => window.confirm(`Delete "${calculation.title}"?`) && void deleteCalculation(calculation.id)}><Trash2 size={16} /></button>
        </div>
      </div>

      <div>
        <div className="pf-label">Values you know</div>
        <div className="pf-grid-edit">
          <table>
            <thead><tr><th>Symbol</th><th>Name (optional)</th><th>Value</th><th>Unit</th><th /></tr></thead>
            <tbody>
              {variables.map((row, index) => {
                const problem = result.variables[index]?.error;
                return (
                  <tr key={index}>
                    <td style={{ width: 110 }}><input aria-label={`Variable ${index + 1} symbol`} placeholder="V_in" value={row.symbol} onChange={(event) => setVariable(index, { symbol: event.target.value })} aria-invalid={!!problem} /></td>
                    <td><input aria-label={`Variable ${index + 1} name`} placeholder="Input voltage" value={row.name ?? ""} onChange={(event) => setVariable(index, { name: event.target.value })} /></td>
                    <td style={{ width: 120 }}><input aria-label={`Variable ${index + 1} value`} placeholder="4.7k" value={row.value} onChange={(event) => setVariable(index, { value: event.target.value })} aria-invalid={!!problem} /></td>
                    <td style={{ width: 80 }}><input aria-label={`Variable ${index + 1} unit`} placeholder="V" value={row.unit ?? ""} onChange={(event) => setVariable(index, { unit: event.target.value })} /></td>
                    <td style={{ width: 36 }}><button className="pf-icon-btn" style={{ width: 28, height: 28 }} aria-label={`Remove variable ${index + 1}`} onClick={() => setVariables(variables.filter((_, i) => i !== index))}><Trash2 size={13} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {result.variables.map((item, index) => item.error && <div key={index} className="pf-calc-error" role="alert"><AlertCircle size={14} aria-hidden /> {item.symbol || `Variable ${index + 1}`}: {item.error}</div>)}
        <button className="pf-btn pf-btn-sm" style={{ marginTop: 8 }} onClick={() => setVariables([...variables, blankVariable()])}><Plus size={13} aria-hidden /> Value</button>
        <p className="pf-hint">Write values with a letter for the prefix: 4.7k is 4700, 100m is 0.1, 1u is 0.000001. Give the unit without the prefix, such as A or Ω.</p>
      </div>

      <div>
        <div className="pf-label">What to work out</div>
        <div className="pf-grid-edit">
          <table>
            <thead><tr><th>Symbol</th><th>Formula</th><th>Unit</th><th title="Digits after the point. Leave empty for automatic.">Decimals</th><th /></tr></thead>
            <tbody>
              {steps.map((row, index) => (
                <tr key={index}>
                  <td style={{ width: 110 }}><input aria-label={`Step ${index + 1} symbol`} placeholder="R_B" value={row.symbol} onChange={(event) => setStep(index, { symbol: event.target.value })} aria-invalid={!!result.steps[index]?.error} /></td>
                  <td><input aria-label={`Step ${index + 1} formula`} placeholder="(V_in - V_BE) / I_B" value={row.expression} onChange={(event) => setStep(index, { expression: event.target.value })} aria-invalid={!!result.steps[index]?.error} /></td>
                  <td style={{ width: 80 }}><input aria-label={`Step ${index + 1} unit`} placeholder="Ω" value={row.unit ?? ""} onChange={(event) => setStep(index, { unit: event.target.value })} /></td>
                  <td style={{ width: 80 }}><input aria-label={`Step ${index + 1} decimals`} inputMode="numeric" value={row.decimals ?? ""} onChange={(event) => setStep(index, { decimals: event.target.value === "" ? null : Math.max(0, Math.min(8, Number(event.target.value) || 0)) })} /></td>
                  <td style={{ width: 36 }}><button className="pf-icon-btn" style={{ width: 28, height: 28 }} aria-label={`Remove step ${index + 1}`} onClick={() => setSteps(steps.filter((_, i) => i !== index))}><Trash2 size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {result.steps.map((item, index) => item.error && <div key={index} className="pf-calc-error" role="alert"><AlertCircle size={14} aria-hidden /> {item.symbol || `Step ${index + 1}`}: {item.error}</div>)}
        <button className="pf-btn pf-btn-sm" style={{ marginTop: 8 }} onClick={() => setSteps([...steps, blankStep()])}><Plus size={13} aria-hidden /> Step</button>
        <p className="pf-hint">Use + − × ÷ ^ and brackets. Functions: sqrt, parallel, e12 and e24 (nearest standard resistor), sin, cos, ln, log10, abs, min, max. A step can use the results of the steps above it.</p>
      </div>

      <div>
        <label className="pf-label" htmlFor={`note-${calculation.id}`}>Closing line (optional)</label>
        <input id={`note-${calculation.id}`} className="pf-input" placeholder="Chosen: 1000 µF, 25 V" value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} />
      </div>

      <div>
        <div className="pf-label">How it will read in your report</div>
        <div className="pf-working" aria-live="polite">
          {result.lines.length === 0 ? <span className="pf-muted">Add a value and a step to see the working.</span> : result.lines.map((line, index) => <div key={index}><Working line={line} /></div>)}
        </div>
      </div>

      <div>
        <label className="pf-label" htmlFor={`csec-${calculation.id}`}>Which section is it in?</label>
        <select id={`csec-${calculation.id}`} className="pf-input" value={calculation.sectionId ?? ""} onChange={(event) => void updateCalculation(calculation.id, { sectionId: event.target.value || null })}>
          <option value="">Not placed yet</option>
          {sections.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
        </select>
        <p className="pf-hint">The working appears at the end of that section, or exactly where you put its marker on a line of its own.</p>
      </div>

      {error && <div className="pf-alert" role="alert">{error}</div>}
      {dirty && <div style={{ display: "flex", gap: 8 }}><button className="pf-btn pf-btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save calculation"}</button></div>}
    </li>
  );
}

export function CalculationsPage() {
  const { calculations, createCalculation } = useWorkspace();
  const sections = useSectionOptions();
  const params = useSearchParams();
  const [title, setTitle] = useState("");
  const [preset, setPreset] = useState<CalcPreset | null>(null);
  const [sectionId, setSectionId] = useState(params.get("section") ?? "");
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState("");

  const choose = (next: CalcPreset | null) => {
    setPreset(next);
    if (next && !title) setTitle(next.title);
  };

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const created = await createCalculation({
        title: title.trim(),
        sectionId: sectionId || null,
        note: preset?.note ?? null,
        variables: preset?.variables ?? [blankVariable()],
        steps: preset?.steps ?? [blankStep()],
      });
      setFresh(created.id);
      setTitle("");
      setPreset(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pf-section" style={{ maxWidth: 940 }}>
      <div className="pf-eyebrow">Tools</div>
      <h1 style={{ margin: "0 0 6px", fontSize: 28 }}>Calculations</h1>
      <p className="pf-lede" style={{ marginBottom: 20 }}>Enter what you know and the formulas. ProjectForge does the arithmetic and writes each step the way examiners expect: the formula, then your numbers, then the answer with its unit. Because it works the numbers out, you can't copy a wrong answer into your report.</p>

      <form onSubmit={add} className="pf-card" style={{ padding: 16, marginBottom: 20, display: "grid", gap: 14 }}>
        <div>
          <div className="pf-label">Start from</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="pf-btn pf-btn-sm" aria-pressed={preset === null} style={preset === null ? { borderColor: "var(--pf-brand)", background: "var(--pf-brand-soft)" } : undefined} onClick={() => choose(null)}>Blank</button>
            {CALC_PRESETS.map((item) => (
              <button type="button" key={item.id} className="pf-btn pf-btn-sm" aria-pressed={preset?.id === item.id} title={item.summary} style={preset?.id === item.id ? { borderColor: "var(--pf-brand)", background: "var(--pf-brand-soft)" } : undefined} onClick={() => choose(item)}>{item.title}</button>
            ))}
          </div>
          {preset && <p className="pf-hint">{preset.summary} The values are examples. Change them to your own.</p>}
        </div>
        <div className="pf-inline-form" style={{ marginTop: 0, flexWrap: "wrap" }}>
          <input className="pf-input" style={{ flex: "1 1 240px" }} aria-label="Calculation title" placeholder="Title, e.g. Filter capacitor" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={300} />
          <select className="pf-input" style={{ flex: "0 1 240px" }} aria-label="Section" value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
            <option value="">Choose the section later</option>
            {sections.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
          </select>
          <button className="pf-btn pf-btn-primary" disabled={busy || !title.trim()}><Plus size={16} aria-hidden /> Add</button>
        </div>
      </form>

      {calculations.length === 0 ? (
        <div className="pf-empty"><h3>No calculations yet</h3><p className="pf-muted">Design calculations, such as a power supply or a resistor value, go here.</p></div>
      ) : (
        <ul className="pf-list" style={{ gap: 16 }}>{calculations.map((calculation) => <CalculationCard key={calculation.id} calculation={calculation} startOpen={calculation.id === fresh} />)}</ul>
      )}
    </div>
  );
}
