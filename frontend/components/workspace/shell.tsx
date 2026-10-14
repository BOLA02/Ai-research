"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Calculator, CheckSquare, Download, IdCard, Image as ImageIcon, Menu, Plus, Table2, X } from "lucide-react";
import { useWorkspace } from "@/lib/workspace/provider";
import { buildSectionTree, isStarted, writingItems, type SectionNode } from "@/lib/workspace/outline";

const tools = [
  { label: "Project details", slug: "details", tip: "Your name, registration number and supervisor, printed on the cover and approval pages", icon: IdCard },
  { label: "References", slug: "references", tip: "Sources you cite, in IEEE or APA", icon: BookOpen },
  { label: "Figures", slug: "figures", tip: "Diagrams and photos, numbered for you", icon: ImageIcon },
  { label: "Tables", slug: "tables", tip: "Results and specifications, numbered for you", icon: Table2 },
  { label: "Calculations", slug: "calculations", tip: "Work out values step by step and show the working", icon: Calculator },
  { label: "Checks", slug: "validation", tip: "See what your department's guidelines still need", icon: CheckSquare },
  { label: "Export", slug: "export", tip: "Download your report as a Word document", icon: Download },
];

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const { status, error, project, template, documents, chapters } = useWorkspace();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [path]);

  const items = useMemo(() => (project ? writingItems(project.id, documents, chapters, template) : []), [project, documents, chapters, template]);
  const done = items.filter((item) => isStarted(item.content)).length;
  const percent = items.length ? Math.round((done / items.length) * 100) : 0;

  if (status === "loading") return <div className="pf-app pf-loading" role="status">Opening your project…</div>;
  if (status === "error" || !project)
    return (
      <div className="pf-app pf-loading">
        <div style={{ textAlign: "center" }}>
          <p>{error || "We couldn't open this project."}</p>
          <Link className="pf-btn" href="/dashboard">Back to projects</Link>
        </div>
      </div>
    );

  const base = `/projects/${project.id}`;
  const current = (href: string) => (path === href ? ("page" as const) : undefined);
  const generated = new Set(template?.documents.filter((doc) => doc.generated).map((doc) => doc.type));

  const sectionLinks = (nodes: SectionNode[], depth = 0): React.ReactNode =>
    nodes.map((node) => (
      <div key={node.id}>
        <Link href={`${base}/section/${node.id}`} className="pf-link child" style={{ marginLeft: 22 + depth * 14 }} aria-current={current(`${base}/section/${node.id}`)}>
          <span className={`pf-dot ${isStarted(node.content) ? "done" : ""}`} aria-hidden />
          <span className="num">{node.number}</span>
          <span>{node.title}</span>
        </Link>
        {sectionLinks(node.children, depth + 1)}
      </div>
    ));

  return (
    <div className="pf-app">
      <div className="pf-mobilebar">
        <button data-tour="menu" className="pf-icon-btn" onClick={() => setOpen(true)} aria-label="Open outline"><Menu size={20} /></button>
        <strong>{project.title}</strong>
      </div>
      <div className={`pf-scrim ${open ? "open" : ""}`} onClick={() => setOpen(false)} />
      <div className="pf-ws">
        <aside className={`pf-rail ${open ? "open" : ""}`} aria-label="Report outline">
          <div className="pf-rail-head">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Link href="/dashboard" className="pf-back"><ArrowLeft size={14} aria-hidden /> All projects</Link>
              <button className="pf-icon-btn pf-close" onClick={() => setOpen(false)} aria-label="Close outline" style={{ display: open ? "inline-grid" : "none" }}><X size={18} /></button>
            </div>
            <Link href={base} style={{ textDecoration: "none", color: "inherit" }}><h2 className="pf-rail-title">{project.title}</h2></Link>
            <div data-tour="progress"><div className="pf-progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Writing progress"><i style={{ width: `${percent}%` }} /></div>
            <div className="pf-progress-label"><span>{done} of {items.length} parts started</span><span>{percent}%</span></div></div>
          </div>

          <nav className="pf-outline">
            <div data-tour="front">
            <div className="pf-group">Front matter</div>
            {documents.map((doc) => (
              <Link key={doc.id} href={`${base}/page/${doc.id}`} className={`pf-link ${doc.isEnabled ? "" : "dim"}`} aria-current={current(`${base}/page/${doc.id}`)}>
                <span className={`pf-dot ${generated.has(doc.type) ? "auto" : isStarted(doc.content) ? "done" : ""}`} aria-hidden />
                <span>{doc.title}</span>
                {!doc.isEnabled && <span className="pf-tag" style={{ marginLeft: "auto" }}>off</span>}
              </Link>
            ))}

            </div>
            <div data-tour="chapters">
            <div className="pf-group">Chapters</div>
            {chapters.map((chapter) => (
              <div key={chapter.id}>
                <Link href={`${base}/chapter/${chapter.id}`} className="pf-link pf-chapter-link" aria-current={current(`${base}/chapter/${chapter.id}`)}>
                  <span className="num">{chapter.number}</span>
                  <span>{chapter.title}</span>
                </Link>
                {sectionLinks(buildSectionTree(chapter))}
              </div>
            ))}
            <ChapterAdder />
            </div>

            <div data-tour="tools">
            <div className="pf-group">Tools</div>
            {tools.map(({ label, slug, tip, icon: Icon }) => (
              <Link key={slug} data-tip={tip} href={`${base}/${slug}`} className="pf-link" aria-current={current(`${base}/${slug}`)}>
                <Icon size={15} aria-hidden /> {label}
              </Link>
            ))}
            </div>
          </nav>
        </aside>
        <div className="pf-main">{children}</div>
      </div>
    </div>
  );
}

function ChapterAdder() {
  const { createChapter } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  if (!editing)
    return (
      <button className="pf-link" style={{ border: 0, background: "none", width: "100%", cursor: "pointer", font: "inherit" }} onClick={() => setEditing(true)}>
        <Plus size={15} aria-hidden /> Add chapter
      </button>
    );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await createChapter(title.trim());
      setTitle("");
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ padding: "4px 8px", display: "grid", gap: 6 }}>
      <input className="pf-input" autoFocus aria-label="Chapter title" placeholder="Chapter title" value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => event.key === "Escape" && setEditing(false)} />
      <div style={{ display: "flex", gap: 6 }}>
        <button className="pf-btn pf-btn-primary pf-btn-sm" disabled={busy}>Add</button>
        <button type="button" className="pf-btn pf-btn-sm" onClick={() => setEditing(false)}>Cancel</button>
      </div>
    </form>
  );
}
