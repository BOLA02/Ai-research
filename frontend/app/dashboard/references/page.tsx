"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookMarked } from "lucide-react";
import { api } from "@/lib/api";
import type { ApiProject, ApiSource } from "@/lib/workspace/types";

type Row = { project: ApiProject; sources: ApiSource[] };

export default function Page() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ projects: ApiProject[] }>("/projects")
      .then(async ({ projects }) =>
        Promise.all(projects.map(async (project) => ({ project, sources: (await api<{ sources: ApiSource[] }>(`/projects/${project.id}/sources`)).sources }))),
      )
      .then(setRows)
      .catch(() => setError("We couldn't load your references. Check your connection and refresh."));
  }, []);

  return (
    <main className="pf-page">
      <div className="pf-page-head">
        <div>
          <div className="pf-eyebrow">Your workspace</div>
          <h1>References</h1>
          <p className="pf-lede">Sources are kept with each project, so they are cited and numbered in the right report. Open a project to add or edit them.</p>
        </div>
      </div>
      {error && <div className="pf-alert" role="alert">{error}</div>}
      {rows && rows.length === 0 && <div className="pf-empty"><BookMarked size={28} aria-hidden color="var(--pf-brand)" /><h3>No projects yet</h3><Link className="pf-btn pf-btn-primary" href="/dashboard/projects/new">Start a project</Link></div>}
      {rows && rows.length > 0 && (
        <ul className="pf-list">
          {rows.map(({ project, sources }) => (
            <li key={project.id}>
              <Link className="pf-row" href={`/projects/${project.id}/references`}>
                <BookMarked size={18} aria-hidden />
                <span className="grow"><strong>{project.title}</strong><small>{sources.length} source{sources.length === 1 ? "" : "s"} · {project.referenceStyle ?? "IEEE"} referencing</small></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
