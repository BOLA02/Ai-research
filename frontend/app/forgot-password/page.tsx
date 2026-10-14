"use client";
import Link from "next/link";
import { useState } from "react";
import { Wrench } from "lucide-react";
import { api, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return setError("Enter the email address you signed up with.");
    setBusy(true);
    setError("");
    try {
      await api("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: email.trim() }) });
      setSent(true);
    } catch (reason) {
      setError(reason instanceof ApiError && reason.code === "AUTH_RATE_LIMITED" ? "Too many requests. Please try again later." : "We couldn't send that. Check the address and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="forgot-title">
        <div className="login-brand"><Wrench size={20} /> ProjectForge</div>
        <h1 id="forgot-title">Forgot your password?</h1>
        {sent ? (
          <>
            <p className="muted" role="status">If an account exists for <strong>{email.trim()}</strong>, we've sent a link to choose a new password. It works for an hour. Check your spam folder too.</p>
            <p className="auth-switch"><Link href="/login">Back to sign in</Link></p>
          </>
        ) : (
          <>
            <p className="muted">Enter your email address and we'll send you a link to choose a new password.</p>
            <form onSubmit={submit} noValidate>
              {error && <div className="login-error" role="alert">{error}</div>}
              <label><span className="label">Email address</span><input className="field" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
              <button className="btn btn-primary login-submit" type="submit" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
            </form>
            <p className="auth-switch"><Link href="/login">Back to sign in</Link></p>
          </>
        )}
      </section>
    </main>
  );
}
