"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, FolderPlus } from "lucide-react";
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

      {(user?.experienceLevel === "beginner" || projects?.length === 0) && (
        <Link href="/example" className="pf-card pf-project-card" style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20, background: "var(--pf-accent-soft)", borderColor: "#e8cf9c" }}>
          <BookOpen size={26} aria-hidden color="#7a4f10" style={{ flex: "none" }} />
          <span style={{ flex: 1 }}>
            <strong style={{ display: "block" }}>New to project reports? See a finished one first.</strong>
            <span style={{ fontSize: 14, color: "#4d3410" }}>A 15-minute walkthrough of a complete example, with notes on why each part works.</span>
          </span>
          <ArrowRight size={18} aria-hidden />
        </Link>
      )}

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
