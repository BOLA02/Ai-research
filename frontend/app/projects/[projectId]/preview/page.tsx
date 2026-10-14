import { redirect } from "next/navigation";

// The old on-screen preview has been replaced by the Word export.
export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  redirect(`/projects/${projectId}/export`);
}
