import { AppShell } from "@/components/workspace/app-shell";
import { ProtectedRoute } from "@/components/protected-route";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
