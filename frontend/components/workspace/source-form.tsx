"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ApiSource, Author, SourceInput, SourceType } from "@/lib/workspace/types";

type FieldName = "containerTitle" | "year" | "month" | "day" | "volume" | "issue" | "pages" | "edition" | "publisher" | "place" | "institution" | "degree" | "number" | "url" | "doi";

type Spec = {
  label: string;
  titleLabel: string;
  authors: boolean | "optional";
  authorLabel?: string;
  editors?: boolean;
  fields: Partial<Record<FieldName, string>>;
};

export const SOURCE_TYPES: Record<SourceType, Spec> = {
  BOOK: { label: "Book", titleLabel: "Book title", authors: true, fields: { edition: "Edition (e.g. 3rd)", place: "City of publication", publisher: "Publisher", year: "Year", doi: "DOI", url: "Web address" } },
  BOOK_CHAPTER: { label: "Book chapter", titleLabel: "Chapter title", authors: true, editors: true, fields: { containerTitle: "Book title", edition: "Edition (e.g. 2nd)", pages: "Pages (e.g. 192-217)", place: "City of publication", publisher: "Publisher", year: "Year" } },
  JOURNAL: { label: "Journal article", titleLabel: "Article title", authors: true, fields: { containerTitle: "Journal name", volume: "Volume", issue: "Issue", pages: "Pages (e.g. 303-308)", month: "Month (1-12)", year: "Year", doi: "DOI", url: "Web address" } },
  CONFERENCE: { label: "Conference paper", titleLabel: "Paper title", authors: true, fields: { containerTitle: "Conference name", place: "Location", pages: "Pages", year: "Year", url: "Web address" } },
  WEBSITE: { label: "Website", titleLabel: "Page title", authors: "optional", authorLabel: "Author", fields: { institution: "Website or organisation", year: "Year", month: "Month (1-12)", day: "Day", url: "Web address" } },
  THESIS: { label: "Thesis or project report", titleLabel: "Title", authors: true, fields: { degree: "Type (e.g. HND project)", institution: "Department and institution", place: "City, country", year: "Year", url: "Web address" } },
  REPORT: { label: "Technical report", titleLabel: "Report title", authors: "optional", fields: { institution: "Organisation", place: "City", number: "Report number", year: "Year", url: "Web address" } },
  STANDARD: { label: "Standard", titleLabel: "Standard title", authors: false, fields: { number: "Standard number (e.g. IEEE standard 18-2012)", institution: "Issuing body", publisher: "Publisher", place: "City", year: "Year" } },
  PATENT: { label: "Patent", titleLabel: "Patent title", authors: true, authorLabel: "Inventor", fields: { number: "Patent number", place: "Country (e.g. U.S.)", month: "Month (1-12)", day: "Day", year: "Year" } },
  OTHER: { label: "Other", titleLabel: "Title", authors: "optional", fields: { containerTitle: "Published in", year: "Year", url: "Web address" } },
};

const numeric: FieldName[] = ["year", "month", "day"];
const ALL_FIELDS: FieldName[] = ["containerTitle", "year", "month", "day", "volume", "issue", "pages", "edition", "publisher", "place", "institution", "degree", "number", "url", "doi"];

function AuthorRows({ label, rows, onChange }: { label: string; rows: Author[]; onChange: (rows: Author[]) => void }) {
  const set = (index: number, patch: Partial<Author>) => onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  return (
    <div>
      <div className="pf-label">{label}</div>
      <div style={{ display: "grid", gap: 8 }}>
        {rows.map((row, index) => {
          const group = row.given === undefined;
          return (
            <div key={index} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {!group && <input className="pf-input" style={{ flex: "1 1 160px" }} aria-label={`${label} ${index + 1} given names`} placeholder="Given names" value={row.given ?? ""} onChange={(event) => set(index, { given: event.target.value })} />}
              <input className="pf-input" style={{ flex: "1 1 160px" }} aria-label={`${label} ${index + 1} ${group ? "organisation" : "family name"}`} placeholder={group ? "Organisation or group" : "Family name"} value={row.family} onChange={(event) => set(index, { family: event.target.value })} />
              <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center", color: "var(--pf-ink-soft)" }}>
                <input type="checkbox" checked={group} onChange={(event) => set(index, { given: event.target.checked ? undefined : "" })} /> Organisation
              </label>
              <button type="button" className="pf-icon-btn" aria-label={`Remove ${label.toLowerCase()} ${index + 1}`} onClick={() => onChange(rows.filter((_, i) => i !== index))}><Trash2 size={16} /></button>
            </div>
          );
        })}
      </div>
      <button type="button" className="pf-btn pf-btn-sm" style={{ marginTop: 8 }} onClick={() => onChange([...rows, { family: "", given: "" }])}><Plus size={14} aria-hidden /> Add {label.toLowerCase()}</button>
    </div>
  );
}

type Props = { initial?: ApiSource; onSave: (input: SourceInput) => Promise<void>; onCancel: () => void };

export function SourceForm({ initial, onSave, onCancel }: Props) {
  const [type, setType] = useState<SourceType>(initial?.type ?? "BOOK");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [authors, setAuthors] = useState<Author[]>(initial?.authors.length ? initial.authors : [{ family: "", given: "" }]);
  const [editors, setEditors] = useState<Author[]>(initial?.editors ?? []);
  const [values, setValues] = useState<Partial<Record<FieldName, string>>>(() =>
    Object.fromEntries(ALL_FIELDS.map((name) => [name, initial?.[name] != null ? String(initial[name]) : ""])),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const spec = SOURCE_TYPES[type];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return setError(`Enter the ${spec.titleLabel.toLowerCase()}.`);
    const clean = (rows: Author[]) => rows.filter((row) => row.family.trim()).map((row) => ({ family: row.family.trim(), ...(row.given?.trim() ? { given: row.given.trim() } : {}) }));
    const input: Record<string, unknown> = { type, title: title.trim(), authors: spec.authors ? clean(authors) : [], editors: spec.editors ? clean(editors) : [] };
    for (const name of Object.keys(spec.fields) as FieldName[]) {
      const raw = (values[name] ?? "").trim();
      input[name] = numeric.includes(name) ? (raw ? Number(raw) : null) : raw || null;
    }
    // Fields that do not belong to this type are cleared so old values don't linger.
    for (const name of ALL_FIELDS) if (!(name in spec.fields)) input[name] = null;
    if (spec.authors === true && !(input.authors as Author[]).length) return setError(`Add at least one ${(spec.authorLabel ?? "author").toLowerCase()}.`);
    setBusy(true);
    setError("");
    try {
      await onSave(input as SourceInput);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Couldn't save this source.");
      setBusy(false);
    }
  };

  return (
    <form className="pf-card" style={{ padding: 20, display: "grid", gap: 16 }} onSubmit={submit}>
      <div>
        <label className="pf-label" htmlFor="source-type">What kind of source is it?</label>
        <select id="source-type" className="pf-input" value={type} onChange={(event) => setType(event.target.value as SourceType)}>
          {Object.entries(SOURCE_TYPES).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
        </select>
      </div>
      {spec.authors && <AuthorRows label={spec.authorLabel ?? "Author"} rows={authors} onChange={setAuthors} />}
      <div>
        <label className="pf-label" htmlFor="source-title">{spec.titleLabel}</label>
        <input id="source-title" className="pf-input" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={1000} />
      </div>
      {spec.editors && <AuthorRows label="Editor" rows={editors} onChange={setEditors} />}
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {(Object.entries(spec.fields) as [FieldName, string][]).map(([name, label]) => (
          <div key={name}>
            <label className="pf-label" htmlFor={`source-${name}`}>{label}</label>
            <input id={`source-${name}`} className="pf-input" inputMode={numeric.includes(name) ? "numeric" : undefined} value={values[name] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))} />
          </div>
        ))}
      </div>
      {error && <div className="pf-alert" role="alert">{error}</div>}
      <div className="pf-actions" style={{ margin: 0 }}>
        <button className="pf-btn pf-btn-primary" disabled={busy}>{busy ? "Saving…" : initial ? "Save changes" : "Add source"}</button>
        <button type="button" className="pf-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
