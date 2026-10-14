import { AppShell } from "@/components/workspace/app-shell";
import { ProtectedRoute } from "@/components/protected-route";
import { ReadinessCheck } from "@/components/workspace/readiness-check";

export default function Page() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ReadinessCheck />
      </AppShell>
    </ProtectedRoute>
  );
}
