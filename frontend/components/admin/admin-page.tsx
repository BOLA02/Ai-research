"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, FolderKanban, Loader2, RefreshCw, ShieldAlert, Users } from "lucide-react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Overview = {
  users: { total: number; signups24h: number; signups7d: number; deactivated: number; online: number; active24h: number; active7d: number };
  projects: { total: number; created7d: number; sectionsWritten: number };
  last7d: { exports: number; aiReviews: number };
  failedLogins24h: number;
  signupsByDay: { date: string; count: number }[];
  activityByDay: { date: string; count: number }[];
  eventsByType: { type: string; count: number }[];
};
type UserRow = { id: string; name: string; email: string; role: string; isActive: boolean; level: string | null; joined: string; lastActive: string | null; projects: number };
type EventRow = { id: string; type: string; at: string; userId: string | null; user: { name: string; email: string } | null; projectId: string | null; meta: Record<string, string | number | boolean | null> | null; ip: string | null };
type ProjectRow = { id: string; title: string; template: string | null; owner: { name: string; email: string }; created: string; updated: string; sectionsStarted: number; words: number };
type Paged<T> = { total: number; page: number; pageSize: number } & T;

const TYPES: Record<string, string> = {
  signup: "Signed up", login: "Signed in", login_failed: "Failed sign-in", logout: "Signed out",
  password_reset_requested: "Asked for a password reset", password_reset_completed: "Reset their password",
  onboarding_completed: "Answered the readiness questions", project_created: "Created a project", project_deleted: "Deleted a project",
  export_docx: "Downloaded a Word report", image_uploaded: "Uploaded a picture", ai_review: "Used the writing coach",
  account_deactivated: "Account deactivated", account_activated: "Account reactivated",
};

function ago(iso: string | null) {
  if (!iso) return "never";
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)} d ago`;
  return new Date(iso).toLocaleDateString();
}
const full = (iso: string) => new Date(iso).toLocaleString();

function describe(event: EventRow) {
  const m = event.meta ?? {};
  switch (event.type) {
    case "login_failed": return `Failed sign-in for ${m.email ?? "an unknown email"}`;
    case "project_created": return `Created a project: ${m.title ?? ""}`;
    case "export_docx": return `Downloaded a Word report${m.kb ? ` (${m.kb} KB)` : ""}`;
    case "image_uploaded": return `Uploaded a picture${m.kb ? ` (${m.kb} KB)` : ""}`;
    case "ai_review": return `Used the writing coach on a ${m.kind === "document" ? "front page" : "section"}`;
    case "onboarding_completed": return `Answered the readiness questions${m.level ? `, level: ${m.level}` : ""}`;
    default: return TYPES[event.type] ?? event.type;
  }
}

function Bars({ data, label }: { data: { date: string; count: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <figure style={{ margin: 0 }} aria-label={label}>
      <div className="ad-bars" role="img" aria-label={`${label}: ${data.map((d) => `${d.date} ${d.count}`).join(", ")}`}>
        {data.map((d) => <i key={d.date} style={{ height: `${Math.max(3, (d.count / max) * 100)}%` }} title={`${d.date}: ${d.count}`} data-zero={d.count === 0 ? "" : undefined} />)}
      </div>
      <figcaption className="pf-hint" style={{ display: "flex", justifyContent: "space-between", margin: "4px 0 0" }}><span>{data[0]?.date.slice(5)}</span><span>{label}</span><span>{data[data.length - 1]?.date.slice(5)}</span></figcaption>
    </figure>
  );
}

const Stat = ({ label, value, note, tone }: { label: string; value: number | string; note?: string; tone?: "warn" }) => (
  <div className="ad-stat">
    <span>{label}</span>
    <strong style={tone === "warn" && Number(value) > 0 ? { color: "var(--pf-danger)" } : undefined}>{value}</strong>
    {note && <small>{note}</small>}
  </div>
);

export function AdminPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"overview" | "activity" | "users" | "projects">("overview");
  const [userFilter, setUserFilter] = useState<{ id: string; name: string } | null>(null);
  if (loading) return null;
  if (user?.role !== "admin")
    return (
      <div className="pf-section" style={{ maxWidth: 560 }}>
        <ShieldAlert size={28} aria-hidden color="var(--pf-danger)" />
        <h1 style={{ fontSize: 26 }}>This area is for administrators</h1>
        <p className="pf-muted">If you should have access, ask the site owner to add your email to the administrators list.</p>
        <Link className="pf-btn" href="/dashboard">Back to your projects</Link>
      </div>
    );

  const tabs = [["overview", "Overview", Activity], ["activity", "Activity", Activity], ["users", "Users", Users], ["projects", "Projects", FolderKanban]] as const;
  return (
    <div className="pf-section" style={{ maxWidth: 1100 }}>
      <div className="pf-eyebrow">Administration</div>
      <h1 style={{ margin: "4px 0 6px", fontSize: 30 }}>What&apos;s happening on ProjectForge</h1>
      <p className="pf-lede" style={{ marginBottom: 16 }}>Numbers and activity only. Students&apos; writing is never shown here.</p>
      <div role="tablist" aria-label="Admin sections" className="pf-seg" style={{ marginBottom: 18, flexWrap: "wrap" }}>
        {tabs.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}</button>)}
      </div>
      {tab === "overview" && <OverviewTab />}
      {tab === "activity" && <ActivityTab filter={userFilter} clear={() => setUserFilter(null)} />}
      {tab === "users" && <UsersTab onActivity={(id, name) => { setUserFilter({ id, name }); setTab("activity"); }} meId={user.id} />}
      {tab === "projects" && <ProjectsTab />}
    </div>
  );
}

function useLoad<T>(path: string, every?: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setBusy(true);
    try {
      setData(await api<T>(path));
      setError("");
    } catch (reason) {
      setError(reason instanceof ApiError && reason.code === "ADMIN_ONLY" ? "This area is for administrators." : "We couldn't load this. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }, [path]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!every) return;
    const timer = window.setInterval(() => void load(), every);
    return () => window.clearInterval(timer);
  }, [every, load]);
  return { data, error, busy, reload: load };
}

function Shell({ error, busy, reload, children }: { error: string; busy: boolean; reload: () => void; children: React.ReactNode }) {
  return (
    <>
      {error && <div className="pf-alert" role="alert">{error} <button className="pf-btn pf-btn-sm" onClick={reload}>Try again</button></div>}
      {children}
      {busy && !error && <p className="pf-muted" role="status"><Loader2 size={14} className="spin" aria-hidden /> Loading…</p>}
    </>
  );
}

function OverviewTab() {
  const { data, error, busy, reload } = useLoad<Overview>("/admin/overview", 30_000);
  return (
    <Shell error={error} busy={busy && !data} reload={reload}>
      {data && (
        <>
          <div className="ad-stats">
            <Stat label="Students online now" value={data.users.online} note="active in the last 5 minutes" />
            <Stat label="Active today" value={data.users.active24h} note={`${data.users.active7d} in the last 7 days`} />
            <Stat label="Total students" value={data.users.total} note={`+${data.users.signups24h} today, +${data.users.signups7d} this week`} />
            <Stat label="Projects" value={data.projects.total} note={`+${data.projects.created7d} this week`} />
            <Stat label="Sections written" value={data.projects.sectionsWritten} />
            <Stat label="Word reports downloaded" value={data.last7d.exports} note="last 7 days" />
            <Stat label="Writing coach uses" value={data.last7d.aiReviews} note="last 7 days" />
            <Stat label="Failed sign-ins" value={data.failedLogins24h} note="last 24 hours" tone="warn" />
          </div>
          <div className="ad-grid">
            <section className="pf-card" style={{ padding: 16 }}><h3 style={{ margin: "0 0 10px" }}>New students</h3><Bars data={data.signupsByDay} label="Sign-ups per day" /></section>
            <section className="pf-card" style={{ padding: 16 }}><h3 style={{ margin: "0 0 10px" }}>Activity</h3><Bars data={data.activityByDay} label="Events per day" /></section>
          </div>
          <section className="pf-card" style={{ padding: 16, marginTop: 16 }}>
            <h3 style={{ margin: "0 0 10px" }}>What people did in the last 7 days</h3>
            {data.eventsByType.length === 0 ? <p className="pf-muted" style={{ margin: 0 }}>Nothing yet.</p> : (
              <ul className="ad-types">{data.eventsByType.map((row) => <li key={row.type}><span>{TYPES[row.type] ?? row.type}</span><strong>{row.count}</strong></li>)}</ul>
            )}
          </section>
          {data.users.deactivated > 0 && <p className="pf-hint">{data.users.deactivated} account{data.users.deactivated === 1 ? " is" : "s are"} currently deactivated.</p>}
        </>
      )}
    </Shell>
  );
}

function Pager({ page, total, size, set }: { page: number; total: number; size: number; set: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "14px 0" }}>
      <button className="pf-btn pf-btn-sm" disabled={page <= 1} onClick={() => set(page - 1)}>Previous</button>
      <span className="pf-muted" style={{ fontSize: 14 }}>Page {page} of {pages} · {total} total</span>
      <button className="pf-btn pf-btn-sm" disabled={page >= pages} onClick={() => set(page + 1)}>Next</button>
    </div>
  );
}

function ActivityTab({ filter, clear }: { filter: { id: string; name: string } | null; clear: () => void }) {
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [live, setLive] = useState(true);
  const query = `/admin/activity?page=${page}${type ? `&type=${type}` : ""}${filter ? `&userId=${filter.id}` : ""}`;
  const { data, error, busy, reload } = useLoad<Paged<{ events: EventRow[] }>>(query, live ? 15_000 : undefined);
  const first = useRef(true);
  useEffect(() => { if (first.current) first.current = false; else setPage(1); }, [type, filter?.id]);
  return (
    <Shell error={error} busy={busy && !data} reload={reload}>
      <div className="ad-filters">
        <label className="sr-only" htmlFor="ad-type" style={{ position: "absolute", left: -9999 }}>What happened</label>
        <select id="ad-type" className="pf-input" style={{ maxWidth: 260 }} value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">All activity</option>
          {Object.entries(TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {filter && <button className="pf-btn pf-btn-sm" onClick={clear} data-tip="Show everyone's activity again">{filter.name} ✕</button>}
        <label className="ad-live"><input type="checkbox" checked={live} onChange={(event) => setLive(event.target.checked)} /> Update by itself</label>
        <button className="pf-btn pf-btn-sm" onClick={reload} aria-label="Refresh now"><RefreshCw size={14} className={busy ? "spin" : ""} aria-hidden /> Refresh</button>
      </div>
      {data && (
        <>
          {data.events.length === 0 ? <p className="pf-muted">No activity yet.</p> : (
            <ul className="ad-feed">
              {data.events.map((event) => (
                <li key={event.id} className={event.type === "login_failed" ? "warn" : ""}>
                  <span className="ad-dot" aria-hidden />
                  <div>
                    <strong>{event.user?.name ?? "Someone"}</strong> <span className="pf-muted">{event.user?.email}</span>
                    <div>{describe(event)}{event.ip && ["login", "login_failed", "signup"].includes(event.type) ? <span className="pf-muted"> · {event.ip}</span> : null}</div>
                  </div>
                  <time dateTime={event.at} title={full(event.at)}>{ago(event.at)}</time>
                </li>
              ))}
            </ul>
          )}
          <Pager page={data.page} total={data.total} size={data.pageSize} set={setPage} />
        </>
      )}
    </Shell>
  );
}

function UsersTab({ onActivity, meId }: { onActivity: (id: string, name: string) => void; meId: string }) {
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  useEffect(() => { const timer = window.setTimeout(() => { setTerm(search); setPage(1); }, 300); return () => window.clearTimeout(timer); }, [search]);
  const { data, error, busy, reload } = useLoad<Paged<{ users: UserRow[] }>>(`/admin/users?page=${page}${term ? `&search=${encodeURIComponent(term)}` : ""}`);
  const toggle = async (row: UserRow) => {
    if (row.isActive && !window.confirm(`Deactivate ${row.name}? They will be signed out and unable to sign in.`)) return;
    setMessage("");
    try {
      await api(`/admin/users/${row.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !row.isActive }) });
      await reload();
    } catch (reason) {
      setMessage(reason instanceof ApiError ? reason.message : "That didn't work. Try again.");
    }
  };
  return (
    <Shell error={error} busy={busy && !data} reload={reload}>
      <div className="ad-filters">
        <label className="sr-only" htmlFor="ad-search" style={{ position: "absolute", left: -9999 }}>Search students</label>
        <input id="ad-search" className="pf-input" style={{ maxWidth: 340 }} placeholder="Search by name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      {message && <div className="pf-alert" role="alert">{message}</div>}
      {data && (
        <>
          <div className="hp-table-wrap">
            <table className="hp-table ad-table">
              <thead><tr><th>Student</th><th>Joined</th><th>Last active</th><th>Projects</th><th>Level</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {data.users.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.name}</strong>{row.role === "admin" && <span className="pf-tag pf-tag-accent" style={{ marginLeft: 6 }}>Admin</span>}<br /><span className="pf-muted">{row.email}</span></td>
                    <td title={full(row.joined)}>{ago(row.joined)}</td>
                    <td title={row.lastActive ? full(row.lastActive) : undefined}>{ago(row.lastActive)}</td>
                    <td>{row.projects}</td>
                    <td>{row.level ?? "–"}</td>
                    <td>{row.isActive ? "Active" : <span style={{ color: "var(--pf-danger)" }}>Deactivated</span>}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="pf-btn pf-btn-sm" onClick={() => onActivity(row.id, row.name)}>Activity</button>{" "}
                      {row.id !== meId && row.role !== "admin" && <button className="pf-btn pf-btn-sm" onClick={() => void toggle(row)}>{row.isActive ? "Deactivate" : "Reactivate"}</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} total={data.total} size={data.pageSize} set={setPage} />
        </>
      )}
    </Shell>
  );
}

function ProjectsTab() {
  const [page, setPage] = useState(1);
  const { data, error, busy, reload } = useLoad<Paged<{ projects: ProjectRow[] }>>(`/admin/projects?page=${page}`);
  return (
    <Shell error={error} busy={busy && !data} reload={reload}>
      {data && (
        <>
          <div className="hp-table-wrap">
            <table className="hp-table ad-table">
              <thead><tr><th>Project</th><th>Student</th><th>Sections started</th><th>Words</th><th>Last edited</th></tr></thead>
              <tbody>
                {data.projects.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.title}</strong></td>
                    <td>{row.owner.name}<br /><span className="pf-muted">{row.owner.email}</span></td>
                    <td>{row.sectionsStarted}</td>
                    <td>{row.words.toLocaleString()}</td>
                    <td title={full(row.updated)}>{ago(row.updated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} total={data.total} size={data.pageSize} set={setPage} />
        </>
      )}
    </Shell>
  );
}
