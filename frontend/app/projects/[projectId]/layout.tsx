"use client";

import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { WorkspaceProvider } from "@/lib/workspace/provider";
import { WorkspaceShell } from "@/components/workspace/shell";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>();
  return (
    <ProtectedRoute>
      <WorkspaceProvider projectId={projectId}>
        <WorkspaceShell>{children}</WorkspaceShell>
      </WorkspaceProvider>
    </ProtectedRoute>
  );
}
