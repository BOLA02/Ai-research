"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { useWorkspace } from "@/lib/workspace/provider";
import { useReportIndex, useSectionOptions } from "@/lib/workspace/hooks";
import type { ApiTable } from "@/lib/workspace/types";

function TableCard({ table, number }: { table: ApiTable; number?: number }) {
  const { updateTable, deleteTable } = useWorkspace();
  const sections = useSectionOptions();
  const [caption, setCaption] = useState(table.caption);
  const [note, setNote] = useState(table.sourceNote ?? "");
  const [columns, setColumns] = useState(table.columns);
  const [rows, setRows] = useState(table.rows);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dirty = JSON.stringify([columns, rows]) !== JSON.stringify([table.columns, table.rows]);

  const setCell = (r: number, c: number, value: string) => setRows(rows.map((row, i) => (i === r ? row.map((cell, j) => (j === c ? value : cell)) : row)));
  const addRow = () => setRows([...rows, columns.map(() => "")]);
  const addColumn = () => {
    if (columns.length >= 12) return;
    setColumns([...columns, `Column ${columns.length + 1}`]);
    setRows(rows.map((row) => [...row, ""]));
  };
  const removeColumn = (c: number) => {
    if (columns.length <= 1) return;
    setColumns(columns.filter((_, i) => i !== c));
    setRows(rows.map((row) => row.filter((_, i) => i !== c)));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await updateTable(table.id, { columns, rows });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Couldn't save the table.");
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard?.writeText(`[tab:${table.label}]`).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <li className="pf-card" style={{ padding: 18, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <strong style={{ fontSize: 17 }}>{number ? `Table ${number}` : "Table"}</strong>
        <div style={{ display: "flex", gap: 2 }}>
          <button className="pf-btn pf-btn-sm" onClick={copy} title="Copy the marker to mention this table in your text">{copied ? <Check size={14} /> : <Copy size={14} />} <code style={{ background: "none" }}>[tab:{table.label}]</code></button>
          <button className="pf-icon-btn" aria-label={`Delete table ${table.caption}`} onClick={() => window.confirm(`Delete "${table.caption}"?`) && void deleteTable(table.id)}><Trash2 size={16} /></button>
        </div>
      </div>

      <div>
        <label className="pf-label" htmlFor={`tcap-${table.id}`}>Caption</label>
        <input id={`tcap-${table.id}`} className="pf-input" value={caption} maxLength={1000} onChange={(event) => setCaption(event.target.value)} onBlur={() => caption.trim() && caption !== table.caption && void updateTable(table.id, { caption: caption.trim() })} />
      </div>

      <div className="pf-grid-edit">
        <table>
          <thead>
            <tr>
              {columns.map((column, c) => (
                <th key={c}>
                  <div style={{ display: "flex", gap: 2 }}>
                    <input aria-label={`Column ${c + 1} heading`} value={column} onChange={(event) => setColumns(columns.map((item, i) => (i === c ? event.target.value : item)))} />
                    <button className="pf-icon-btn" style={{ width: 28, height: 28, flex: "none" }} aria-label={`Remove column ${c + 1}`} onClick={() => removeColumn(c)} disabled={columns.length <= 1}><Trash2 size={13} /></button>
                  </div>
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => <td key={c}><input aria-label={`Row ${r + 1}, ${columns[c] || `column ${c + 1}`}`} value={cell} onChange={(event) => setCell(r, c, event.target.value)} /></td>)}
                <td><button className="pf-icon-btn" style={{ width: 28, height: 28 }} aria-label={`Remove row ${r + 1}`} onClick={() => setRows(rows.filter((_, i) => i !== r))}><Trash2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <button className="pf-btn pf-btn-sm" onClick={addRow}><Plus size={13} aria-hidden /> Row</button>
          <button className="pf-btn pf-btn-sm" onClick={addColumn} disabled={columns.length >= 12}><Plus size={13} aria-hidden /> Column</button>
          <span style={{ flex: 1 }} />
          {dirty && <button className="pf-btn pf-btn-sm pf-btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save table"}</button>}
        </div>
        {error && <div className="pf-alert" role="alert" style={{ marginTop: 8 }}>{error}</div>}
      </div>

      <div>
        <label className="pf-label" htmlFor={`tsec-${table.id}`}>Which section is it in?</label>
        <select id={`tsec-${table.id}`} className="pf-input" value={table.sectionId ?? ""} onChange={(event) => void updateTable(table.id, { sectionId: event.target.value || null })}>
          <option value="">Not placed yet</option>
          {sections.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
        </select>
      </div>

      <div>
        <label className="pf-label" htmlFor={`tnote-${table.id}`}>Source (optional)</label>
        <input id={`tnote-${table.id}`} className="pf-input" value={note} placeholder="e.g. Measured in the laboratory, or Adapted from [@glover2009]" onChange={(event) => setNote(event.target.value)} onBlur={() => note !== (table.sourceNote ?? "") && void updateTable(table.id, { sourceNote: note.trim() || null })} />
        <p className="pf-hint">Your department asks you to cite the source of each result.</p>
      </div>
    </li>
  );
}

export function TablesPage() {
  const { tables, createTable } = useWorkspace();
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
      await createTable({ caption: caption.trim(), sectionId: sectionId || null });
      setCaption("");
    } finally {
      setBusy(false);
    }
  };

  const rank = (id: string) => index?.tables.find((item) => item.id === id)?.number ?? 999;
  const ordered = [...tables].sort((a, b) => rank(a.id) - rank(b.id));

  return (
    <div className="pf-section" style={{ maxWidth: 900 }}>
      <div className="pf-eyebrow">Tools</div>
      <h1 style={{ margin: "0 0 6px", fontSize: 28 }}>Tables</h1>
      <p className="pf-lede" style={{ marginBottom: 20 }}>Tables are numbered in the order they appear in your report, separately from figures. Mention one in your text with its marker, for example <code>[tab:results]</code>.</p>

      <form onSubmit={add} className="pf-card" style={{ padding: 16, marginBottom: 20 }}>
        <div className="pf-label">Add a table</div>
        <div className="pf-inline-form" style={{ marginTop: 0, flexWrap: "wrap" }}>
          <input className="pf-input" style={{ flex: "1 1 240px" }} aria-label="Table caption" placeholder="Caption, e.g. Design specification" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={1000} />
          <select className="pf-input" style={{ flex: "0 1 240px" }} aria-label="Section" value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
            <option value="">Choose the section later</option>
            {sections.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
          </select>
          <button className="pf-btn pf-btn-primary" disabled={busy || !caption.trim()}><Plus size={16} aria-hidden /> Add</button>
        </div>
      </form>

      {tables.length === 0 ? (
        <div className="pf-empty"><h3>No tables yet</h3><p className="pf-muted">Specifications, measurements and comparisons go here.</p></div>
      ) : (
        <ul className="pf-list" style={{ gap: 16 }}>{ordered.map((table) => <TableCard key={table.id} table={table} number={index?.tables.find((item) => item.id === table.id)?.number} />)}</ul>
      )}
    </div>
  );
}
