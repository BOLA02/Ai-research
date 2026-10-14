"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, PenLine } from "lucide-react";
import { useAuth } from "@/lib/auth";

const links = [
  { label: "Projects", href: "/dashboard" },
  { label: "References", href: "/dashboard/references" },
];

const isActive = (path: string, href: string) =>
  href === "/dashboard" ? path === "/dashboard" || path.startsWith("/dashboard/projects") : path.startsWith(href);

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const name = user ? `${user.firstName} ${user.lastName}` : "";
  const initials = user ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() : "";

  // New students answer the readiness questions once, before they see the dashboard.
  useEffect(() => {
    if (user && !user.onboardedAt && path.startsWith("/dashboard")) router.replace("/welcome");
  }, [user, path, router]);

  const signOut = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="pf-app">
      <header className="pf-topbar">
        <Link href="/dashboard" className="pf-brand">
          <span className="pf-brand-mark"><PenLine size={16} aria-hidden /></span>
          <span className="pf-brand-name">ProjectForge</span>
        </Link>
        <nav className="pf-nav" aria-label="Main">
          {links.map((link) => (
            <Link key={link.href} href={link.href} aria-current={isActive(path, link.href) ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>
        <span className="pf-spacer" />
        <div className="pf-user">
          <span className="name">{name}</span>
          <span className="pf-avatar" aria-hidden>{initials}</span>
          <button className="pf-icon-btn" onClick={signOut} aria-label="Sign out" title="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
