"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { API_BASE_URL, api } from "@/lib/api";
import { parseUnits } from "@/lib/workspace/blocks";
import { chapterWord, fillBlanks, fit, toRoman, type PreviewModel, type PreviewSection } from "@/lib/workspace/book";
import { useWorkspace } from "@/lib/workspace/provider";
import { Formatted } from "./formatted";
import { ToolGuide } from "./tool-guide";

const MM = 96 / 25.4;
const PAGE_W = Math.round(210 * MM);
const PAGE_H = Math.round(297 * MM);
const GAP = 48;

type Labels = Record<string, string>;
type Part = { id: string; numbering: "none" | "roman" | "arabic"; fixedPages?: number; node: (labels: Labels) => React.ReactNode };
type Page = { part: Part; col: number; label: string | null; show: boolean; position: "bottom" | "top" | null };
type Layout = { pages: Page[]; labels: Labels };

/* ------------------------------------------------------------------ text */

function Text({ text, justified, className }: { text: string; justified: boolean; className?: string }) {
  return (
    <>
      {parseUnits(text).map((unit, index) => {
        const align = unit.align ?? (justified ? "justify" : "left");
        return unit.kind === "para" ? (
          <p key={index} className={`bk-p ${className ?? ""}`} style={{ textAlign: align }}>
            {unit.lines.map((line, i) => <span key={i}>{i > 0 && <br />}<Formatted text={line} /></span>)}
          </p>
        ) : (
          <p key={index} className={`bk-p bk-item ${className ?? ""}`} style={{ textAlign: align }}>
            <span className="bk-marker">{unit.marker}</span>
            <span><Formatted text={unit.text} /></span>
          </p>
        );
      })}
    </>
  );
}

/** V_pk is shown as V with a lowered "pk". */
function Working({ line }: { line: string }) {
  return <>{line.split(/(_[\p{L}\p{N}]+)/gu).filter(Boolean).map((piece, i) => (piece.startsWith("_") && piece.length > 1 ? <sub key={i}>{piece.slice(1)}</sub> : <span key={i}>{piece}</span>))}</>;
}

/* --------------------------------------------------------------- content */

function buildParts(model: PreviewModel, projectId: string): Part[] {
  const just = model.format.justified;
  const identity = (size: number, bookmark?: string) => (
    <div className="bk-identity" style={{ fontSize: `${size}pt` }}>
      <p data-key={bookmark} style={{ marginBottom: 36 }}>{model.title.toUpperCase()}</p>
      <p>RESEARCH PROJECT BY</p>
      <p>{model.studentName.toUpperCase() || "YOUR NAME"}</p>
      <p style={{ marginBottom: 36 }}>{model.registrationNumber.toUpperCase() || "REGISTRATION NUMBER"}</p>
      {[model.department, model.school, model.college, model.institution, model.location].filter(Boolean).map((line) => <p key={line}>{line.toUpperCase()}</p>)}
      <p style={{ marginTop: 28 }}>IN PARTIAL FULFILMENT OF THE REQUIREMENTS FOR THE AWARD OF {model.award}</p>
      <p style={{ marginTop: 28 }}>{model.year}</p>
    </div>
  );
  const frontHeading = (key: string, title: string) => <h2 data-key={key} className="bk-front-h bk-newpage">{title.toUpperCase()}</h2>;
  const caption = (kind: "Figure" | "Table", id: string, number: number, text: string) => <p data-key={`${kind === "Figure" ? "fig" : "tab"}:${id}`} className="bk-caption">{`${kind} ${number}: ${text}`}</p>;
  const supervisor = model.signatories.find((s) => s.role === "Project Supervisor")?.name;

  const sectionNode = (section: PreviewSection) => (
    <div key={section.id}>
      <h3 data-key={`sec:${section.id}`} className="bk-sec-h">{section.number} {section.title}</h3>
      {section.body.map((part, i) =>
        part.t === "text" ? (
          <Text key={i} text={part.text} justified={just} />
        ) : (
          <div key={i} className="bk-calc">
            <strong>{part.calc.title}</strong>
            {part.calc.lines.map((line, k) => <div key={k}><Working line={line} /></div>)}
          </div>
        ),
      )}
      {section.figures.map((figure) => {
        const size = figure.image ? fit(figure.image.width, figure.image.height, PAGE_W - (25 + 20) * MM, 11 * 37.8) : null;
        return (
          <div key={figure.id} className="bk-figure">
            {figure.image && size ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${API_BASE_URL}/projects/${projectId}/figures/${figure.id}/image`} width={size.width} height={size.height} alt={figure.caption} />
            ) : (
              <em>[Image not added yet]</em>
            )}
            {caption("Figure", figure.id, figure.number, figure.caption)}
            {figure.source && <p className="bk-source">Source: {figure.source}</p>}
          </div>
        );
      })}
      {section.tables.map((table) => (
        <div key={table.id} className="bk-table-wrap">
          {caption("Table", table.id, table.number, table.caption)}
          <table className="bk-table">
            <thead><tr>{table.columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
            <tbody>{table.rows.map((row, r) => <tr key={r}>{table.columns.map((_, c) => <td key={c}>{row[c] ?? ""}</td>)}</tr>)}</tbody>
          </table>
          {table.source && <p className="bk-source">Source: {table.source}</p>}
        </div>
      ))}
    </div>
  );

  const frontNode = (labels: Labels) => (
    <>
      {identity(model.format.titlePageFontSizePt, "title-page")}
      {model.front.map((page) => {
        const key = `front:${page.id}`;
        switch (page.type) {
          case "DECLARATION":
            return (
              <div key={page.id}>
                {frontHeading(key, page.title)}
                <Text text={fillBlanks(page.text, [model.studentName, supervisor])} justified={just} />
                <p style={{ marginTop: 28 }}>{model.studentName || "______________________"}    {model.registrationNumber}    Signature ..................    Date ..............</p>
                <p><em>(Student&apos;s name and registration number)</em></p>
              </div>
            );
          case "APPROVAL_PAGE":
            return (
              <div key={page.id}>
                {frontHeading(key, page.title)}
                <Text text={fillBlanks(page.text, [model.studentName, model.registrationNumber]).split(/\n{2,}/)[0] ?? ""} justified={just} />
                {model.signatories.map((s) => (
                  <div key={s.role} style={{ marginTop: 28 }}>
                    <div className="bk-sig"><span>................................................</span><span>..............................</span></div>
                    <div className="bk-sig"><strong>{s.name.toUpperCase()}</strong><strong>DATE</strong></div>
                    <strong>{s.role.toUpperCase()}</strong>
                  </div>
                ))}
              </div>
            );
          case "TABLE_OF_CONTENTS":
            return (
              <div key={page.id}>
                {frontHeading(key, page.title)}
                {tocEntries(model).map((entry) => (
                  <div key={entry.key} className="bk-toc" style={{ paddingLeft: entry.level * 18, fontWeight: entry.bold ? 700 : 400 }}>
                    <span>{entry.text}</span><i /><span>{labels[entry.key] ?? ""}</span>
                  </div>
                ))}
              </div>
            );
          case "LIST_OF_FIGURES":
          case "LIST_OF_TABLES": {
            const figures = page.type === "LIST_OF_FIGURES";
            const items = figures ? model.figures : model.tables;
            return (
              <div key={page.id}>
                {frontHeading(key, page.title)}
                {items.length === 0 ? <p><em>No {figures ? "figures" : "tables"}.</em></p> : items.map((item) => (
                  <div key={item.id} className="bk-toc"><span>{figures ? "Figure" : "Table"} {item.number}: {item.caption}</span><i /><span>{labels[`${figures ? "fig" : "tab"}:${item.id}`] ?? ""}</span></div>
                ))}
              </div>
            );
          }
          default:
            return (
              <div key={page.id}>
                {frontHeading(key, page.title)}
                <Text text={page.text} justified={just} className={page.type === "ABSTRACT" ? "bk-abstract" : ""} />
              </div>
            );
        }
      })}
    </>
  );

  const parts: Part[] = [
    { id: "cover", numbering: "none", fixedPages: 1, node: () => <div style={{ paddingTop: 70 }}>{identity(model.format.coverFontSizePt)}</div> },
    { id: "flyleaf", numbering: "none", fixedPages: 1, node: () => null },
    { id: "front", numbering: "roman", node: frontNode },
    ...model.chapters.map((chapter): Part => ({
      id: `ch:${chapter.id}`,
      numbering: "arabic",
      node: () => (
        <>
          <h1 data-key={`ch:${chapter.id}`} className="bk-ch-h">CHAPTER {chapterWord(chapter.number)}<br />{chapter.title.toUpperCase()}</h1>
          {chapter.sections.map(sectionNode)}
        </>
      ),
    })),
    {
      id: "refs",
      numbering: "arabic",
      node: () => (
        <>
          <h1 data-key="refs" className="bk-ch-h">REFERENCES</h1>
          {model.references.length === 0 ? <p><em>No sources have been cited yet.</em></p> : model.references.map((ref) => (
            <p key={ref.citeKey} className="bk-ref" style={{ textAlign: just ? "justify" : "left" }}>
              {model.style === "IEEE" && ref.number ? <span className="bk-marker">[{ref.number}]</span> : null}
              <span><Formatted text={ref.formatted} /></span>
            </p>
          ))}
        </>
      ),
    },
    ...model.appendices.map((appendix, i): Part => ({
      id: `app:${appendix.id}`,
      numbering: "arabic",
      node: () => (
        <>
          <h1 data-key={`app:${appendix.id}`} className="bk-ch-h">APPENDIX {toRoman(i + 1)}: {appendix.title.toUpperCase()}</h1>
          <Text text={appendix.text} justified={just} />
        </>
      ),
    })),
  ];
  return parts;
}

function tocEntries(model: PreviewModel) {
  const entries: { key: string; text: string; level: number; bold: boolean }[] = [{ key: "title-page", text: "Title Page", level: 0, bold: false }];
  for (const page of model.front) entries.push({ key: `front:${page.id}`, text: page.title, level: 0, bold: false });
  for (const chapter of model.chapters) {
    entries.push({ key: `ch:${chapter.id}`, text: `CHAPTER ${chapterWord(chapter.number)}: ${chapter.title.toUpperCase()}`, level: 0, bold: true });
    for (const section of chapter.sections) entries.push({ key: `sec:${section.id}`, text: `${section.number} ${section.title}`, level: section.depth, bold: false });
  }
  entries.push({ key: "refs", text: "REFERENCES", level: 0, bold: true });
  model.appendices.forEach((a, i) => entries.push({ key: `app:${a.id}`, text: `APPENDIX ${toRoman(i + 1)}: ${a.title.toUpperCase()}`, level: 0, bold: true }));
  return entries;
}

/* ------------------------------------------------------------------ flow */

function flowStyle(model: PreviewModel, width: number, height: number): React.CSSProperties {
  return {
    width, height, columnWidth: width, columnGap: GAP, columnFill: "auto", position: "relative",
    fontFamily: `"${model.format.fontFamily}", "Times New Roman", Times, serif`, fontSize: `${model.format.fontSizePt}pt`,
    ["--bk-line" as string]: String(model.format.bodyLineSpacing), ["--bk-abs-line" as string]: String(model.format.abstractLineSpacing),
  };
}

export function BookPage() {
  const { project, flushSaves } = useWorkspace();
  const [model, setModel] = useState<PreviewModel | null>(null);
  const [error, setError] = useState("");
  const [labels, setLabels] = useState<Labels>({});
  const [layout, setLayout] = useState<Layout | null>(null);
  const [spread, setSpread] = useState(0);
  const [width, setWidth] = useState(1000);
  const box = useRef<HTMLDivElement>(null);
  const measure = useRef<Record<string, HTMLDivElement | null>>({});
  const rounds = useRef(0);

  const load = useCallback(async () => {
    if (!project) return;
    setError("");
    try {
      await flushSaves();
      const data = await api<{ model: PreviewModel }>(`/projects/${project.id}/export/preview`);
      rounds.current = 0;
      setLabels({});
      setLayout(null);
      setModel(data.model);
    } catch {
      setError("We couldn't open the book. Check your connection and try again.");
    }
  }, [project, flushSaves]);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setWidth(element.clientWidth));
    observer.observe(element);
    setWidth(element.clientWidth);
    return () => observer.disconnect();
  }, [model]);

  const margins = model?.format.marginsMm;
  const contentW = margins ? PAGE_W - Math.round((margins.left + margins.right) * MM) : 0;
  const contentH = margins ? PAGE_H - Math.round((margins.top + margins.bottom) * MM) : 0;
  const parts = useMemo(() => (model && project ? buildParts(model, project.id) : []), [model, project]);

  // Lay the book out: pour each part into columns the size of a page, count them, and note where headings land.
  useLayoutEffect(() => {
    if (!model || parts.length === 0) return;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const pages: Page[] = [];
      const found: Record<string, { part: number; col: number }> = {};
      let roman = 0;
      let arabic = 0;
      parts.forEach((part, p) => {
        const element = measure.current[part.id];
        let count = part.fixedPages ?? 1;
        if (element && !part.fixedPages) {
          count = Math.max(1, Math.round((element.scrollWidth + GAP) / (contentW + GAP)));
          const origin = element.getBoundingClientRect().left;
          element.querySelectorAll<HTMLElement>("[data-key]").forEach((node) => {
            const col = Math.min(count - 1, Math.max(0, Math.floor((node.getBoundingClientRect().left - origin + 2) / (contentW + GAP))));
            if (!(node.dataset.key! in found)) found[node.dataset.key!] = { part: p, col };
          });
        }
        const start = pages.length;
        for (let col = 0; col < count; col += 1) {
          const label = part.numbering === "none" ? null : part.numbering === "roman" ? toRoman(++roman, true) : String(++arabic);
          const hidden = part.id === "front" && col === 0; // the title page is counted but shows no number
          pages.push({ part, col, label, show: part.numbering !== "none" && !hidden, position: part.numbering === "roman" || col === 0 ? "bottom" : "top" });
        }
        for (const [key, at] of Object.entries(found)) if (at.part === p && !(key in labelsOf)) labelsOf[key] = pagesLabel(pages, start + at.col);
      });
      const labelsOf2 = labelsOf;
      setLayout({ pages, labels: labelsOf2 });
      // The contents page shows page numbers, so lay out again once they are known.
      if (JSON.stringify(labelsOf2) !== JSON.stringify(labels) && rounds.current < 4) {
        rounds.current += 1;
        setLabels(labelsOf2);
      }
    };
    const labelsOf: Labels = {};
    const pagesLabel = (pages: Page[], index: number) => pages[index]?.label ?? "";
    const frame = requestAnimationFrame(() => requestAnimationFrame(run)); // let images and fonts settle
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [model, parts, labels, contentW]);

  const single = width < 900;
  const pages = layout?.pages ?? [];
  const shown: (Page | null)[] = useMemo(() => (single ? pages : [null, ...pages]), [single, pages]);
  const perView = single ? 1 : 2;
  const views = Math.max(1, Math.ceil(shown.length / perView));
  const view = Math.min(spread, views - 1);
  const visible = shown.slice(view * perView, view * perView + perView);
  const scale = Math.min(1, (width - 8) / (perView * PAGE_W + (perView - 1) * 6));

  const go = useCallback((to: number) => setSpread(Math.max(0, Math.min(views - 1, to))), [views]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest("input, textarea, select")) return;
      if (event.key === "ArrowRight") go(view + 1);
      if (event.key === "ArrowLeft") go(view - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, view]);

  const touch = useRef<number | null>(null);
  if (!project) return null;

  const bodyPages = pages.filter((page) => page.part.id !== "cover" && page.part.id !== "flyleaf").length;
  const jumpTargets = pages.map((page, index) => ({ page, index })).filter(({ page }) => page.col === 0 && page.part.id !== "flyleaf");
  const jump = (index: number) => go(Math.floor((single ? index : index + 1) / perView));
  const describe = (page: Page) => (page.part.id === "cover" ? "Cover" : page.part.id === "front" ? "Front matter" : page.part.id === "refs" ? "References" : page.part.id.startsWith("app:") ? "Appendix" : `Chapter ${model?.chapters.findIndex((c) => `ch:${c.id}` === page.part.id)! + 1}`);

  return (
    <div className="pf-section" style={{ maxWidth: 1200 }}>
      <div className="pf-eyebrow">Tools</div>
      <div className="pf-page-head" style={{ marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Book view</h1>
        <ToolGuide id="book" label="Book view" steps={[
          { target: "book", placement: "top", title: "Your report as a book", body: <p>This is your report laid out like the printed pages, cover first. It shows what the Word download will look like.</p> },
          { target: "book-nav", placement: "bottom", title: "Turn the pages", body: <p>Use the arrows, the left and right keys, or swipe on a phone. Jump straight to a chapter from the list.</p> },
        ]} />
      </div>
      <p className="pf-lede" style={{ marginBottom: 14 }}>Open your report page by page, as your examiners will read it. Page breaks here are close to Word&apos;s but not always identical, so use Export for the final check.</p>

      {error && <div className="pf-alert" role="alert">{error} <button className="pf-btn pf-btn-sm" onClick={() => void load()}>Try again</button></div>}
      {!model && !error && <p className="pf-muted" role="status"><Loader2 size={14} className="spin" aria-hidden /> Opening your book…</p>}

      {model && (
        <>
          <div className="bk-bar" data-tour="book-nav">
            <button className="pf-btn pf-btn-sm" onClick={() => go(view - 1)} disabled={view === 0} aria-label="Previous pages"><ChevronLeft size={16} aria-hidden /> Back</button>
            <label className="sr-only" htmlFor="bk-jump" style={{ position: "absolute", left: -9999 }}>Jump to</label>
            <select id="bk-jump" className="pf-input" style={{ flex: "1 1 160px", maxWidth: 260 }} value="" onChange={(event) => event.target.value && jump(Number(event.target.value))}>
              <option value="">Jump to…</option>
              {jumpTargets.map(({ page, index }) => <option key={index} value={index}>{describe(page)}</option>)}
            </select>
            <span className="pf-muted bk-count" role="status">{bodyPages > 0 ? `${bodyPages} pages` : ""}{model.format.minPages ? ` (asked for ${model.format.minPages} to about ${model.format.maxPages})` : ""}</span>
            <button className="pf-btn pf-btn-sm" onClick={() => go(view + 1)} disabled={view >= views - 1} aria-label="Next pages">Next <ChevronRight size={16} aria-hidden /></button>
          </div>

          <div
            ref={box}
            className="bk-stage"
            data-tour="book"
            onTouchStart={(event) => { touch.current = event.touches[0].clientX; }}
            onTouchEnd={(event) => {
              if (touch.current === null) return;
              const delta = event.changedTouches[0].clientX - touch.current;
              touch.current = null;
              if (Math.abs(delta) > 50) go(view + (delta < 0 ? 1 : -1));
            }}
          >
            {!layout ? <p className="pf-muted" style={{ textAlign: "center", padding: 40 }}><Loader2 size={14} className="spin" aria-hidden /> Laying out the pages…</p> : (
              <div style={{ width: (perView * PAGE_W + (perView - 1) * 6) * scale, height: PAGE_H * scale, flex: "none", position: "relative" }}>
              <div className="bk-spread" style={{ width: perView * PAGE_W + (perView - 1) * 6, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", left: 0, top: 0 }}>
                {visible.map((page, i) => (
                  <div key={i} className={`bk-sheet ${page ? "" : "empty"}`} style={{ width: PAGE_W, height: PAGE_H }}>
                    {page && (
                      <>
                        <div className="bk-clip" style={{ left: Math.round(margins!.left * MM), top: Math.round(margins!.top * MM), width: contentW, height: contentH }}>
                          <div style={{ ...flowStyle(model, contentW, contentH), transform: `translateX(${-page.col * (contentW + GAP)}px)` }} className="bk-flow">{page.part.node(layout.labels)}</div>
                        </div>
                        {page.show && page.label && page.position === "bottom" && <div className="bk-num bottom">{page.label}</div>}
                        {page.show && page.label && page.position === "top" && <div className="bk-num top">{page.label}</div>}
                      </>
                    )}
                  </div>
                ))}
              </div>
              </div>
            )}
          </div>
          <p className="pf-hint" style={{ textAlign: "center" }}>
            {visible.filter(Boolean).length ? `Showing ${visible.filter(Boolean).map((page) => (page!.show && page!.label ? (page!.part.numbering === "roman" ? page!.label : `page ${page!.label}`) : describe(page!))).join(" and ")}` : ""} · <Link href={`/projects/${project.id}/export`}>Download the Word file</Link>
          </p>

          {/* Hidden copy of every part, used only to count pages and find where headings fall. */}
          <div className="bk-measure" aria-hidden>
            {parts.map((part) => (
              <div key={part.id} ref={(element) => { measure.current[part.id] = element; }} className="bk-flow" style={flowStyle(model, contentW, contentH)}>{part.node(labels)}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

