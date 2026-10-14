"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FolderPlus, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ApiProject } from "@/lib/workspace/types";

const typeLabel = (project: ApiProject) => {
  if (project.templateId?.includes("maintenance")) return "Maintenance and repair";
  if (project.templateId?.includes("design")) return "Design and construction";
  return project.projectType || "Project";
};

const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export function ProjectsList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ApiProject[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ projects: ApiProject[] }>("/projects")
      .then((data) => setProjects(data.projects))
      .catch(() => setError("We couldn't load your projects. Check your connection and refresh."));
  }, []);

  return (
    <main className="pf-page">
      <div className="pf-page-head">
        <div>
          <div className="pf-eyebrow">Your workspace</div>
          <h1>{user ? `Welcome, ${user.firstName}` : "Projects"}</h1>
          <p className="pf-lede">Write your final-year report chapter by chapter, with your department's guidelines beside you at every step.</p>
        </div>
        <Link className="pf-btn pf-btn-primary" href="/dashboard/projects/new">
          <FolderPlus size={17} aria-hidden /> New project
        </Link>
      </div>

      {error && <div className="pf-alert" role="alert">{error}</div>}

      {projects && projects.length === 0 && (
        <div className="pf-empty">
          <h3>You have no projects yet</h3>
          <p className="pf-muted">Start with your department's template. It sets up every page and chapter your report needs.</p>
          <Link className="pf-btn pf-btn-primary" href="/dashboard/projects/new">Start your first project</Link>
        </div>
      )}

      {projects && projects.length > 0 && (
        <div className="pf-grid">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="pf-card pf-project-card">
              <span className="pf-tag pf-tag-brand" style={{ alignSelf: "flex-start" }}>{typeLabel(project)}</span>
              <h3>{project.title}</h3>
              <span className="pf-muted" style={{ fontSize: 13 }}>
                {[project.programme, project.department].filter(Boolean).join(" · ")}
              </span>
              <span className="pf-muted" style={{ fontSize: 13, display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                Updated {when(project.updatedAt)} <ArrowRight size={15} aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
