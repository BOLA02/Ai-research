"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, ShieldAlert, Sparkles } from "lucide-react";
import { exampleParts, findExamplePart } from "@/lib/example/water-level";
import type { Block } from "@/lib/example/types";

function BlockView({ block, active, onPick }: { block: Block; active: number | null; onPick: (mark: number) => void }) {
  const mark = "mark" in block ? block.mark : undefined;
  const className = `pf-block ${mark !== undefined && mark === active ? "pf-hl" : ""}`;
  const badge = mark !== undefined && (
    <button className="pf-badge" onClick={() => onPick(mark)} aria-label={`Note ${mark}`}>{mark}</button>
  );

  switch (block.t) {
    case "p":
      return <div className={className}>{badge}<p>{block.text}</p></div>;
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return <div className={className}>{badge}<Tag>{block.items.map((item) => <li key={item}>{item}</li>)}</Tag></div>;
    }
    case "eq":
      return <div className={className}>{badge}<div className="pf-eq">{block.lines.map((line) => <div key={line}>{line}</div>)}</div></div>;
    case "table":
      return (
        <div className={className}>
          {badge}
          <p className="pf-caption">{block.caption}</p>
          <div className="pf-table-wrap">
            <table className="pf-table">
              <thead><tr>{block.head.map((cell) => <th key={cell}>{cell}</th>)}</tr></thead>
              <tbody>{block.rows.map((row) => <tr key={row.join("|")}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
          {block.note && <p className="pf-table-note">{block.note}</p>}
        </div>
      );
    case "figure":
      return (
        <div className={className}>
          {badge}
          <div className="pf-flow" role="img" aria-label={block.caption}>
            {block.nodes.map((node, index) => (
              <span key={node} style={{ display: "contents" }}>
                <span className="pf-flow-node">{node}</span>
                {index < block.nodes.length - 1 && <span className="pf-flow-arrow" aria-hidden>→</span>}
              </span>
            ))}
          </div>
          <p className="pf-caption">{block.caption}</p>
        </div>
      );
    case "cover":
      return (
        <div className="pf-cover">
          {block.lines.map((line, index) => <p key={index}>{line || " "}</p>)}
        </div>
      );
  }
}

export function ExampleViewer() {
  const { partId } = useParams<{ partId: string }>();
  const [active, setActive] = useState<number | null>(null);
  const part = findExamplePart(partId);

  if (!part)
    return (
      <div className="pf-section">
        <h1>We can't find that part</h1>
        <Link className="pf-btn" href="/example">Back to the example</Link>
      </div>
    );

  const index = exampleParts.indexOf(part);
  const prev = exampleParts[index - 1];
  const next = exampleParts[index + 1];
  const pick = (mark?: number) => setActive((current) => (mark === undefined || current === mark ? null : mark));

  return (
    <div className="pf-editor-wrap">
      <div>
        <nav className="pf-crumbs" aria-label="Breadcrumb">
          <span className="pf-tag pf-tag-accent">Example: invented data</span>
          <span>{part.group}</span>
        </nav>
        <h1 className="pf-title-input" style={{ margin: "0 0 14px" }}>{part.number && `${part.number} `}{part.title}</h1>

        <div className="pf-paper pf-doc">
          {part.blocks.map((block, i) => <BlockView key={i} block={block} active={active} onPick={pick} />)}
        </div>

        <div className="pf-editor-foot"><span>Part {index + 1} of {exampleParts.length}</span></div>
        <div className="pf-pager">
          {prev ? <Link className="pf-btn" href={`/example/${prev.id}`} onClick={() => setActive(null)}><ChevronLeft size={16} aria-hidden /> {prev.title}</Link> : <span />}
          {next ? (
            <Link className="pf-btn pf-btn-primary" href={`/example/${next.id}`} onClick={() => setActive(null)}>{next.title} <ChevronRight size={16} aria-hidden /></Link>
          ) : (
            <Link className="pf-btn pf-btn-primary" href="/dashboard/projects/new">Start your own project <ArrowRight size={16} aria-hidden /></Link>
          )}
        </div>
      </div>

      <aside className="pf-guide" aria-label="Why this works">
        <section className="pf-card pf-guide-card">
          <h2><Sparkles size={16} aria-hidden /> Why this works</h2>
          <p style={{ fontWeight: 600, color: "var(--pf-ink)" }}>{part.why.headline}</p>
          <ul className="pf-prompts" style={{ marginTop: 12 }}>
            {part.why.points.map((point) => (
              <li key={point.text}>
                <button className={`pf-why ${point.mark !== undefined && point.mark === active ? "on" : ""}`} onClick={() => pick(point.mark)} disabled={point.mark === undefined} aria-pressed={point.mark !== undefined ? point.mark === active : undefined}>
                  {point.mark !== undefined && <span className="pf-badge static">{point.mark}</span>}
                  <span>{point.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="pf-card pf-guide-card">
          <h2><ShieldAlert size={16} aria-hidden /> Common mistakes</h2>
          <ul className="pf-tips">{part.why.mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul>
        </section>
      </aside>
    </div>
  );
}
