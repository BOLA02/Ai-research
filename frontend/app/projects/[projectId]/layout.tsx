"use client";

import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { WorkspaceProvider } from "@/lib/workspace/provider";
import { WorkspaceShell } from "@/components/workspace/shell";
import { ProjectContentProvider } from "@/lib/project-content";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>();
  return (
    <ProtectedRoute>
      <WorkspaceProvider projectId={projectId}>
        {/* The legacy tool pages (references, figures, tables, preview) still read from this provider. */}
        <ProjectContentProvider projectId={projectId}>
          <WorkspaceShell>{children}</WorkspaceShell>
        </ProjectContentProvider>
      </WorkspaceProvider>
    </ProtectedRoute>
  );
}
