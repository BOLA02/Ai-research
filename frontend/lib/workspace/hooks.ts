"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useWorkspace } from "./provider";
import { buildSectionTree, flattenTree } from "./outline";
import type { ReportIndex } from "./types";

/** Numbering and the bibliography, refetched whenever sources, figures, tables or the style change. */
export function useReportIndex() {
  const { project, sources, figures, tables, flushSaves } = useWorkspace();
  const [index, setIndex] = useState<ReportIndex | null>(null);
  const [error, setError] = useState(false);
  const projectId = project?.id;
  const style = project?.referenceStyle;

  const refresh = useCallback(async () => {
    if (!projectId) return;
    try {
      await flushSaves(); // numbers depend on what has been written, so save first
      const data = await api<{ index: ReportIndex }>(`/projects/${projectId}/report/index`);
      setIndex(data.index);
      setError(false);
    } catch {
      setError(true);
    }
  }, [projectId, flushSaves]);

  useEffect(() => {
    void refresh();
  }, [refresh, sources, figures, tables, style]);

  return { index, error, refresh };
}

/** Every section of the report as "3.2 Design Specification", for choosing where something belongs. */
export function useSectionOptions() {
  const { chapters } = useWorkspace();
  return useMemo(
    () =>
      chapters.flatMap((chapter) =>
        flattenTree(buildSectionTree(chapter)).map((section) => ({ id: section.id, label: `${section.number} ${section.title}` })),
      ),
    [chapters],
  );
}
