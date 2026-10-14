"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { ApiChapter, ApiDocument, ApiFigure, ApiProject, ApiSection, ApiSource, ApiTable, ReferenceStyle, SourceInput, Template } from "./types";

export type SaveState = "idle" | "saving" | "saved" | "error";
export type ContentTarget = { kind: "document"; id: string } | { kind: "section"; id: string; chapterId: string };

type Workspace = {
  status: "loading" | "ready" | "error";
  error: string | null;
  project: ApiProject | null;
  template: Template | null;
  documents: ApiDocument[];
  chapters: ApiChapter[];
  sources: ApiSource[];
  figures: ApiFigure[];
  tables: ApiTable[];
  saveState: SaveState;
  /** Waits until everything typed so far has reached the server. */
  flushSaves: () => Promise<void>;
  setReferenceStyle: (style: ReferenceStyle) => Promise<void>;
  createSource: (input: SourceInput) => Promise<ApiSource>;
  updateSource: (id: string, input: Partial<SourceInput>) => Promise<void>;
  deleteSource: (id: string) => Promise<void>;
  createFigure: (input: { caption: string; sectionId?: string | null; isOriginal?: boolean; sourceNote?: string | null; altText?: string | null }) => Promise<ApiFigure>;
  updateFigure: (id: string, input: Partial<Pick<ApiFigure, "caption" | "sectionId" | "isOriginal" | "sourceNote" | "altText">>) => Promise<void>;
  uploadFigureImage: (id: string, file: File) => Promise<void>;
  removeFigureImage: (id: string) => Promise<void>;
  deleteFigure: (id: string) => Promise<void>;
  createTable: (input: { caption: string; sectionId?: string | null; columns?: string[]; rows?: string[][] }) => Promise<ApiTable>;
  updateTable: (id: string, input: Partial<Pick<ApiTable, "caption" | "sectionId" | "sourceNote" | "columns" | "rows">>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
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
  const [sources, setSources] = useState<ApiSource[]>([]);
  const [figures, setFigures] = useState<ApiFigure[]>([]);
  const [tables, setTables] = useState<ApiTable[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // Pending debounced saves, keyed by target id. The latest content wins.
  const pending = useRef(new Map<string, { target: ContentTarget; content: string; timer: ReturnType<typeof setTimeout> }>());
  const inFlight = useRef(0);
  const settled = useRef(new Set<Promise<unknown>>());

  const reload = useCallback(async () => {
    try {
      const [{ project }, docs, chs, src, figs, tabs] = await Promise.all([
        api<{ project: ApiProject }>(`/projects/${projectId}`),
        api<{ documents: ApiDocument[] }>(`/projects/${projectId}/documents`),
        api<{ chapters: ApiChapter[] }>(`/projects/${projectId}/chapters`),
        api<{ sources: ApiSource[] }>(`/projects/${projectId}/sources`),
        api<{ figures: ApiFigure[] }>(`/projects/${projectId}/figures`),
        api<{ tables: ApiTable[] }>(`/projects/${projectId}/tables`),
      ]);
      // Projects created before templates existed have no templateId; use the default guidance.
      const loaded = await api<{ template: Template }>(`/templates/${project.templateId ?? DEFAULT_TEMPLATE_ID}`).catch(() => null);
      setProject(project);
      setTemplate(loaded?.template ?? null);
      setDocuments(docs.documents);
      setChapters(chs.chapters);
      setSources(src.sources);
      setFigures(figs.figures);
      setTables(tabs.tables);
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
      const request = api(path, { method: "PATCH", body: JSON.stringify({ content }) })
        .then(() => {
          inFlight.current -= 1;
          if (inFlight.current === 0 && pending.current.size === 0) setSaveState("saved");
        })
        .catch(() => {
          inFlight.current -= 1;
          setSaveState("error");
        })
        .finally(() => settled.current.delete(request));
      settled.current.add(request);
      await request;
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

  const flushSaves = useCallback(async () => {
    flush();
    await Promise.all([...settled.current]);
  }, [flush]);

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
      sources,
      figures,
      tables,
      flushSaves,
      setContent,
      reload,
      async setReferenceStyle(style) {
        const data = await api<{ project: ApiProject }>(`/projects/${projectId}`, { method: "PATCH", body: JSON.stringify({ referenceStyle: style }) });
        setProject(data.project);
      },
      async createSource(input) {
        const data = await api<{ source: ApiSource }>(`/projects/${projectId}/sources`, { method: "POST", body: JSON.stringify(input) });
        setSources((rows) => [...rows, data.source]);
        return data.source;
      },
      async updateSource(id, input) {
        const data = await api<{ source: ApiSource }>(`/projects/${projectId}/sources/${id}`, { method: "PATCH", body: JSON.stringify(input) });
        setSources((rows) => rows.map((row) => (row.id === id ? data.source : row)));
      },
      async deleteSource(id) {
        await api(`/projects/${projectId}/sources/${id}`, { method: "DELETE" });
        setSources((rows) => rows.filter((row) => row.id !== id));
      },
      async createFigure(input) {
        const data = await api<{ figure: ApiFigure }>(`/projects/${projectId}/figures`, { method: "POST", body: JSON.stringify(input) });
        setFigures((rows) => [...rows, data.figure]);
        return data.figure;
      },
      async updateFigure(id, input) {
        const data = await api<{ figure: ApiFigure }>(`/projects/${projectId}/figures/${id}`, { method: "PATCH", body: JSON.stringify(input) });
        setFigures((rows) => rows.map((row) => (row.id === id ? data.figure : row)));
      },
      async uploadFigureImage(id, file) {
        const data = await api<{ figure: ApiFigure }>(`/projects/${projectId}/figures/${id}/image`, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        setFigures((rows) => rows.map((row) => (row.id === id ? data.figure : row)));
      },
      async removeFigureImage(id) {
        const data = await api<{ figure: ApiFigure }>(`/projects/${projectId}/figures/${id}/image`, { method: "DELETE" });
        setFigures((rows) => rows.map((row) => (row.id === id ? data.figure : row)));
      },
      async deleteFigure(id) {
        await api(`/projects/${projectId}/figures/${id}`, { method: "DELETE" });
        setFigures((rows) => rows.filter((row) => row.id !== id));
      },
      async createTable(input) {
        const data = await api<{ table: ApiTable }>(`/projects/${projectId}/tables`, { method: "POST", body: JSON.stringify(input) });
        setTables((rows) => [...rows, data.table]);
        return data.table;
      },
      async updateTable(id, input) {
        const data = await api<{ table: ApiTable }>(`/projects/${projectId}/tables/${id}`, { method: "PATCH", body: JSON.stringify(input) });
        setTables((rows) => rows.map((row) => (row.id === id ? data.table : row)));
      },
      async deleteTable(id) {
        await api(`/projects/${projectId}/tables/${id}`, { method: "DELETE" });
        setTables((rows) => rows.filter((row) => row.id !== id));
      },
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
    [status, error, project, template, documents, chapters, sources, figures, tables, saveState, flushSaves, setContent, reload, projectId],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("WorkspaceProvider is missing");
  return value;
}
