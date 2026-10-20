import { AppShell } from "@/components/workspace/app-shell";
import { ProtectedRoute } from "@/components/protected-route";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
