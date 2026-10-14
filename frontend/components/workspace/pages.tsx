"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, Info, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/workspace/provider";
import { buildSectionTree, chapterTemplate, documentGuidance, flattenTree, isStarted, sectionGuidance, wordCount, writingItems, type SectionNode } from "@/lib/workspace/outline";
import { Editor } from "./editor";
import { GuidancePanel } from "./guidance";

function useItems() {
  const { project, documents, chapters, template } = useWorkspace();
  return useMemo(() => (project ? writingItems(project.id, documents, chapters, template) : []), [project, documents, chapters, template]);
}

function NotFound({ what }: { what: string }) {
  const { project } = useWorkspace();
  return (
    <div className="pf-section">
      <h1>We can't find that {what}</h1>
      <p className="pf-muted">It may have been deleted.</p>
      <Link className="pf-btn" href={`/projects/${project?.id}`}>Back to the project</Link>
    </div>
  );
}

/* ---------------------------------------------------------------- Home */

export function ProjectHome() {
  const { project, template } = useWorkspace();
  const items = useItems();
  if (!project) return null;

  const done = items.filter((item) => isStarted(item.content)).length;
  const next = items.find((item) => !isStarted(item.content)) ?? items[0];
  const format = template?.format;

  return (
    <div className="pf-section">
      <div className="pf-eyebrow">{template?.name ?? "Project"}</div>
      <h1 style={{ margin: "4px 0 8px", fontSize: 30, letterSpacing: "-0.02em" }}>{project.title}</h1>
      <p className="pf-lede">
        {done === 0
          ? "Your report is set up. Start anywhere: the guidance beside each part tells you what examiners look for."
          : `${done} of ${items.length} parts started. Keep going one section at a time.`}
      </p>
      {next && (
        <div className="pf-actions">
          <Link className="pf-btn pf-btn-primary" href={next.href}>
            {done === 0 ? "Start writing" : "Continue writing"}: {next.title} <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      )}

      <div className="pf-two">
        {template && (
          <section className="pf-card">
            <h3>Deadlines to plan for</h3>
            <ol className="pf-timeline">
              {template.milestones.map((milestone) => (
                <li key={milestone.id}>
                  <strong>{milestone.title}</strong>
                  <span>{milestone.timing}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
        {format && (
          <section className="pf-card">
            <h3>Format your department requires</h3>
            <dl className="pf-facts">
              <div><dt>Font</dt><dd>{format.fontFamily}, {format.fontSizePt} pt</dd></div>
              <div><dt>Line spacing</dt><dd>{format.bodyLineSpacing}</dd></div>
              <div><dt>Margins</dt><dd>L {format.marginsMm.left} · T/B/R {format.marginsMm.top} mm</dd></div>
              <div><dt>Length</dt><dd>{format.minPages} to about {format.maxPages} pages</dd></div>
              <div><dt>Referencing</dt><dd>{template?.referenceStyle}</dd></div>
            </dl>
            <p className="pf-hint">The export applies these for you, so you can focus on the writing.</p>
          </section>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------ Front-matter page */

export function DocumentPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const { project, documents, template, patchDocument } = useWorkspace();
  const { user } = useAuth();
  const items = useItems();
  const doc = documents.find((row) => row.id === documentId);
  if (!project || !doc) return <NotFound what="page" />;

  const info = documentGuidance(template, doc.type);
  const guidance = info?.guidance ?? { purpose: "", prompts: [] };
  const crumbs = [{ label: project.title, href: `/projects/${project.id}` }, { label: "Front matter" }, { label: doc.title }];

  if (info?.generated) {
    const showCover = doc.type === "COVER_PAGE" || doc.type === "TITLE_PAGE";
    return (
      <div className="pf-editor-wrap">
        <div>
          <nav className="pf-crumbs" aria-label="Breadcrumb">{crumbs.map((crumb, index) => <span key={crumb.label}>{index > 0 && " / "}{crumb.label}</span>)}</nav>
          <h1 className="pf-title-input" style={{ margin: "0 0 14px" }}>{doc.title}</h1>
          <div className="pf-callout"><Info size={18} aria-hidden style={{ flex: "none", marginTop: 2 }} /><span>This page is built for you from your project details when you export. There is nothing to type here.</span></div>
          {showCover && (
            <div className="pf-paper" style={{ textAlign: "center", fontFamily: "var(--pf-serif)", fontWeight: 700, lineHeight: 1.9, fontSize: doc.type === "COVER_PAGE" ? 16 : 14 }}>
              <p style={{ margin: "0 0 28px" }}>{project.title.toUpperCase()}</p>
              <p style={{ margin: 0 }}>RESEARCH PROJECT BY</p>
              <p style={{ margin: "0 0 28px" }}>{user ? `${user.firstName} ${user.lastName}`.toUpperCase() : "YOUR NAME"}<br />YOUR REGISTRATION NUMBER</p>
              <p style={{ margin: "0 0 28px" }}>{(project.department || "").toUpperCase()}<br />{(project.institution || "").toUpperCase()}</p>
              <p style={{ margin: 0 }}>IN PARTIAL FULFILMENT OF THE REQUIREMENTS FOR THE AWARD OF HIGHER NATIONAL DIPLOMA</p>
              <p style={{ margin: "28px 0 0" }}>{new Date().getFullYear()}</p>
            </div>
          )}
        </div>
        <GuidancePanel guidance={{ ...guidance, prompts: [] }} />
      </div>
    );
  }

  const index = items.findIndex((item) => item.id === doc.id);
  const banner = !doc.isEnabled ? (
    <div className="pf-callout">
      <Info size={18} aria-hidden style={{ flex: "none", marginTop: 2 }} />
      <span>This page is turned off, so it won't appear in your report. <button className="pf-btn pf-btn-sm" onClick={() => patchDocument(doc.id, { isEnabled: true })}>Include it</button></span>
    </div>
  ) : null;

  return (
    <>
      <Editor
        target={{ kind: "document", id: doc.id }}
        title={doc.title}
        crumbs={crumbs}
        content={doc.content}
        guidance={guidance}
        optional={info?.optional}
        placeholder={doc.type === "ABSTRACT" ? "Write this last. Cover what you did, how, what you found and what it means." : "Start writing…"}
        neighbours={{ prev: items[index - 1], next: items[index + 1] }}
        banner={banner}
      />
      {info?.optional && doc.isEnabled && (
        <div className="pf-editor-wrap" style={{ paddingTop: 0 }}>
          <button className="pf-btn pf-btn-sm" onClick={() => patchDocument(doc.id, { isEnabled: false })}>Leave this page out of my report</button>
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------- Section */

export function SectionPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const { project, chapters, template, renameSection } = useWorkspace();
  const items = useItems();
  if (!project) return null;

  const chapter = chapters.find((row) => row.sections.some((section) => section.id === sectionId));
  const section = chapter ? flattenTree(buildSectionTree(chapter)).find((node) => node.id === sectionId) : undefined;
  if (!chapter || !section) return <NotFound what="section" />;

  const { guidance, optional, custom } = sectionGuidance(template, section.templateKey);
  const index = items.findIndex((item) => item.id === section.id);

  return (
    <Editor
      target={{ kind: "section", id: section.id, chapterId: chapter.id }}
      title={section.title}
      onRename={(title) => void renameSection(chapter.id, section.id, title)}
      crumbs={[
        { label: project.title, href: `/projects/${project.id}` },
        { label: `Chapter ${chapter.number}: ${chapter.title}`, href: `/projects/${project.id}/chapter/${chapter.id}` },
        { label: section.number },
      ]}
      content={section.content}
      guidance={guidance}
      optional={optional}
      custom={custom}
      placeholder="Start writing. Use the questions on the right if you're not sure where to begin."
      neighbours={{ prev: items[index - 1], next: items[index + 1] }}
    />
  );
}

/* -------------------------------------------------------------- Chapter */

export function ChapterPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const router = useRouter();
  const { project, chapters, template, renameChapter, deleteChapter, createSection } = useWorkspace();
  const [name, setName] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [parent, setParent] = useState("");
  const [busy, setBusy] = useState(false);
  const chapter = chapters.find((row) => row.id === chapterId);
  if (!project || !chapter) return <NotFound what="chapter" />;

  const tree = buildSectionTree(chapter);
  const all = flattenTree(tree);
  const done = all.filter((node) => isStarted(node.content)).length;
  const studentDefined = chapterTemplate(template, chapter.templateKey)?.studentDefined;
  const base = `/projects/${project.id}`;
  const heading = name ?? chapter.title;

  const addSection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const id = await createSection(chapter.id, title.trim(), parent || null);
      router.push(`${base}/section/${id}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${chapter.title}" and everything you wrote in it? This can't be undone.`)) return;
    await deleteChapter(chapter.id);
    router.push(base);
  };

  const row = (node: SectionNode): React.ReactNode => (
    <li key={node.id}>
      <Link className="pf-row" href={`${base}/section/${node.id}`} style={{ marginLeft: (node.number.split(".").length - 2) * 20 }}>
        <span className={`pf-dot ${isStarted(node.content) ? "done" : ""}`} aria-hidden />
        <span className="grow">
          <strong>{node.number}</strong> {node.title}
          <small>{wordCount(node.content)} words</small>
        </span>
        <ArrowRight size={15} aria-hidden />
      </Link>
      {node.children.length > 0 && <ul className="pf-list" style={{ marginTop: 8 }}>{node.children.map(row)}</ul>}
    </li>
  );

  return (
    <div className="pf-section">
      <div className="pf-eyebrow">Chapter {chapter.number}</div>
      <input
        className="pf-title-input"
        aria-label="Chapter title"
        value={heading}
        maxLength={500}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => {
          const next = (name ?? "").trim();
          if (name !== null && next && next !== chapter.title) void renameChapter(chapter.id, next);
          setName(null);
        }}
        onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
        autoFocus={!!studentDefined && all.length === 0}
      />
      <p className="pf-lede" style={{ margin: "0 0 18px" }}>{all.length ? `${done} of ${all.length} sections started.` : "No sections yet."}</p>

      {studentDefined && (
        <div className="pf-callout">
          <Info size={18} aria-hidden style={{ flex: "none", marginTop: 2 }} />
          <span>Your department leaves this chapter's title and sections to you. Name it above, then add the sections it needs. Check with your supervisor if you're unsure what to include.</span>
        </div>
      )}

      {tree.length > 0 && <ul className="pf-list">{tree.map(row)}</ul>}

      <form onSubmit={addSection} className="pf-card" style={{ padding: 16, marginTop: 20 }}>
        <label className="pf-label" htmlFor="new-section">Add a section</label>
        <div className="pf-inline-form" style={{ marginTop: 0, flexWrap: "wrap" }}>
          <input id="new-section" className="pf-input" style={{ flex: "1 1 220px" }} placeholder="Section title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={500} />
          {tree.length > 0 && (
            <select className="pf-input" style={{ flex: "0 1 200px" }} aria-label="Where to add it" value={parent} onChange={(event) => setParent(event.target.value)}>
              <option value="">At the top level</option>
              {tree.map((node) => <option key={node.id} value={node.id}>Inside {node.number} {node.title}</option>)}
            </select>
          )}
          <button className="pf-btn pf-btn-primary" disabled={busy || !title.trim()}><Plus size={16} aria-hidden /> Add</button>
        </div>
        <p className="pf-hint">Don't go deeper than three levels, such as 3.4.1.</p>
      </form>

      <div className="pf-actions" style={{ marginTop: 32 }}>
        <button className="pf-btn pf-btn-danger pf-btn-sm" onClick={remove}><Trash2 size={14} aria-hidden /> Delete this chapter</button>
      </div>
    </div>
  );
}
