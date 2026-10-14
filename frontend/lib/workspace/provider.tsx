"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { ApiChapter, ApiDocument, ApiProject, ApiSection, Template } from "./types";

export type SaveState = "idle" | "saving" | "saved" | "error";
export type ContentTarget = { kind: "document"; id: string } | { kind: "section"; id: string; chapterId: string };

type Workspace = {
  status: "loading" | "ready" | "error";
  error: string | null;
  project: ApiProject | null;
  template: Template | null;
  documents: ApiDocument[];
  chapters: ApiChapter[];
  saveState: SaveState;
  setContent: (target: ContentTarget, content: string) => void;
  patchDocument: (id: string, input: { title?: string; isEnabled?: boolean }) => Promise<void>;
  createChapter: (title: string) => Promise<string>;
  renameChapter: (id: string, title: string) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;
  createSection: (chapterId: string, title: string, parentSectionId?: string | null) => Promise<string>;
  renameSection: (chapterId: string, id: string, title: string) => Promise<void>;
  deleteSection: (chapterId: string, id: string) => Promise<void>;
  reload: () => Promise<void>;
};

const Context = createContext<Workspace | null>(null);
const SAVE_DELAY_MS = 800;
const DEFAULT_TEMPLATE_ID = "eee-hnd-design";

export function WorkspaceProvider({ projectId, children }: { projectId: string; children: React.ReactNode }) {
  const [status, setStatus] = useState<Workspace["status"]>("loading");
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<ApiProject | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [chapters, setChapters] = useState<ApiChapter[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // Pending debounced saves, keyed by target id. The latest content wins.
  const pending = useRef(new Map<string, { target: ContentTarget; content: string; timer: ReturnType<typeof setTimeout> }>());
  const inFlight = useRef(0);

  const reload = useCallback(async () => {
    try {
      const [{ project }, docs, chs] = await Promise.all([
        api<{ project: ApiProject }>(`/projects/${projectId}`),
        api<{ documents: ApiDocument[] }>(`/projects/${projectId}/documents`),
        api<{ chapters: ApiChapter[] }>(`/projects/${projectId}/chapters`),
      ]);
      // Projects created before templates existed have no templateId; use the default guidance.
      const loaded = await api<{ template: Template }>(`/templates/${project.templateId ?? DEFAULT_TEMPLATE_ID}`).catch(() => null);
      setProject(project);
      setTemplate(loaded?.template ?? null);
      setDocuments(docs.documents);
      setChapters(chs.chapters);
      setError(null);
      setStatus("ready");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load this project");
      setStatus("error");
    }
  }, [projectId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const send = useCallback(
    async (target: ContentTarget, content: string) => {
      const path =
        target.kind === "document"
          ? `/projects/${projectId}/documents/${target.id}`
          : `/projects/${projectId}/chapters/${target.chapterId}/sections/${target.id}`;
      inFlight.current += 1;
      setSaveState("saving");
      try {
        await api(path, { method: "PATCH", body: JSON.stringify({ content }) });
        inFlight.current -= 1;
        if (inFlight.current === 0 && pending.current.size === 0) setSaveState("saved");
      } catch {
        inFlight.current -= 1;
        setSaveState("error");
      }
    },
    [projectId],
  );

  const flush = useCallback(() => {
    for (const [id, entry] of pending.current) {
      clearTimeout(entry.timer);
      pending.current.delete(id);
      void send(entry.target, entry.content);
    }
  }, [send]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (pending.current.size) {
        flush();
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      flush();
    };
  }, [flush]);

  const setContent = useCallback(
    (target: ContentTarget, content: string) => {
      if (target.kind === "document") setDocuments((rows) => rows.map((row) => (row.id === target.id ? { ...row, content } : row)));
      else
        setChapters((rows) =>
          rows.map((chapter) =>
            chapter.id !== target.chapterId
              ? chapter
              : { ...chapter, sections: chapter.sections.map((section) => (section.id === target.id ? { ...section, content } : section)) },
          ),
        );
      const existing = pending.current.get(target.id);
      if (existing) clearTimeout(existing.timer);
      setSaveState("saving");
      const timer = setTimeout(() => {
        pending.current.delete(target.id);
        void send(target, content);
      }, SAVE_DELAY_MS);
      pending.current.set(target.id, { target, content, timer });
    },
    [send],
  );

  const value = useMemo<Workspace>(
    () => ({
      status,
      error,
      project,
      template,
      documents,
      chapters,
      saveState,
      setContent,
      reload,
      async patchDocument(id, input) {
        const data = await api<{ document: ApiDocument }>(`/projects/${projectId}/documents/${id}`, { method: "PATCH", body: JSON.stringify(input) });
        setDocuments((rows) => rows.map((row) => (row.id === id ? { ...row, ...data.document } : row)));
      },
      async createChapter(title) {
        const data = await api<{ chapter: ApiChapter }>(`/projects/${projectId}/chapters`, { method: "POST", body: JSON.stringify({ title }) });
        await reload();
        return data.chapter.id;
      },
      async renameChapter(id, title) {
        await api(`/projects/${projectId}/chapters/${id}`, { method: "PATCH", body: JSON.stringify({ title }) });
        setChapters((rows) => rows.map((chapter) => (chapter.id === id ? { ...chapter, title } : chapter)));
      },
      async deleteChapter(id) {
        await api(`/projects/${projectId}/chapters/${id}`, { method: "DELETE" });
        await reload();
      },
      async createSection(chapterId, title, parentSectionId = null) {
        const data = await api<{ section: ApiSection }>(`/projects/${projectId}/chapters/${chapterId}/sections`, {
          method: "POST",
          body: JSON.stringify({ title, parentSectionId }),
        });
        await reload();
        return data.section.id;
      },
      async renameSection(chapterId, id, title) {
        await api(`/projects/${projectId}/chapters/${chapterId}/sections/${id}`, { method: "PATCH", body: JSON.stringify({ title }) });
        setChapters((rows) =>
          rows.map((chapter) =>
            chapter.id !== chapterId ? chapter : { ...chapter, sections: chapter.sections.map((section) => (section.id === id ? { ...section, title } : section)) },
          ),
        );
      },
      async deleteSection(chapterId, id) {
        await api(`/projects/${projectId}/chapters/${chapterId}/sections/${id}`, { method: "DELETE" });
        await reload();
      },
    }),
    [status, error, project, template, documents, chapters, saveState, setContent, reload, projectId],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("WorkspaceProvider is missing");
  return value;
}
