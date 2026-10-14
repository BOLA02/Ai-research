"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Wrench } from "lucide-react";
import { api, ApiError } from "@/lib/api";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="login-page"><section className="login-panel">Loading…</section></main>}>
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    setError("");
    try {
      await api("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password, confirmPassword: confirm }) });
      setDone(true);
    } catch (reason) {
      setError(reason instanceof ApiError && reason.code === "RESET_LINK_INVALID" ? "This link has expired or was already used. Ask for a new one." : "We couldn't change your password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="reset-title">
        <div className="login-brand"><Wrench size={20} /> ProjectForge</div>
        <h1 id="reset-title">Choose a new password</h1>
        {done ? (
          <>
            <p className="muted" role="status">Your password has been changed. You've been signed out everywhere, so sign in with the new one.</p>
            <Link className="btn btn-primary login-submit" href="/login">Sign in</Link>
          </>
        ) : !token ? (
          <>
            <p className="muted">This link is incomplete. Open the link from your email again, or ask for a new one.</p>
            <p className="auth-switch"><Link href="/forgot-password">Send me a new link</Link></p>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            {error && <div className="login-error" role="alert">{error} {error.startsWith("This link") && <Link href="/forgot-password">Send a new link</Link>}</div>}
            <label><span className="label">New password</span><input className="field" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            <label><span className="label">Confirm new password</span><input className="field" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required /></label>
            <button className="btn btn-primary login-submit" type="submit" disabled={busy}>{busy ? "Saving…" : "Change password"}</button>
          </form>
        )}
      </section>
    </main>
  );
}
