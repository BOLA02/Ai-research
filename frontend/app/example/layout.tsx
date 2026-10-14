import { ExampleShell } from "@/components/example/shell";
import { ProtectedRoute } from "@/components/protected-route";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <ExampleShell>{children}</ExampleShell>
    </ProtectedRoute>
  );
}
