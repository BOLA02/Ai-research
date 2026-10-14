"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Menu, X } from "lucide-react";
import { EXAMPLE_TITLE, exampleGroups, exampleParts } from "@/lib/example/water-level";

export function ExampleShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  return (
    <div className="pf-app">
      <div className="pf-mobilebar">
        <button className="pf-icon-btn" onClick={() => setOpen(true)} aria-label="Open outline"><Menu size={20} /></button>
        <strong>Example report</strong>
      </div>
      <div className={`pf-scrim ${open ? "open" : ""}`} onClick={() => setOpen(false)} />
      <div className="pf-ws">
        <aside className={`pf-rail ${open ? "open" : ""}`} aria-label="Example report outline">
          <div className="pf-rail-head">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Link href="/dashboard" className="pf-back"><ArrowLeft size={14} aria-hidden /> Back to projects</Link>
              <button className="pf-icon-btn" onClick={() => setOpen(false)} aria-label="Close outline" style={{ display: open ? "inline-grid" : "none" }}><X size={18} /></button>
            </div>
            <Link href="/example" style={{ textDecoration: "none", color: "inherit" }}>
              <span className="pf-tag pf-tag-accent" style={{ marginBottom: 8 }}><BookOpen size={12} aria-hidden /> Worked example</span>
              <h2 className="pf-rail-title">{EXAMPLE_TITLE}</h2>
            </Link>
          </div>
          <nav className="pf-outline">
            {exampleGroups.map((group) => (
              <div key={group}>
                <div className="pf-group">{group}</div>
                {exampleParts.filter((part) => part.group === group).map((part) => {
                  const href = `/example/${part.id}`;
                  return (
                    <Link key={part.id} href={href} className="pf-link" aria-current={path === href ? "page" : undefined}>
                      {part.number && <span className="num">{part.number}</span>}
                      <span>{part.title}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>
        <div className="pf-main">{children}</div>
      </div>
    </div>
  );
}
