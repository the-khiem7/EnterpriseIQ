"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/ask", label: "Ask", hint: "multi-hop Q&A" },
  { href: "/documents", label: "Documents", hint: "ingest & status" },
  { href: "/graph", label: "Graph", hint: "explore entities" },
  { href: "/status", label: "Status", hint: "system health" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <aside
      className="shrink-0 border-r bg-surface/60 backdrop-blur sticky top-0 h-screen flex flex-col"
      style={{ width: "var(--rail-w)" }}
    >
      <Link href="/" className="flex items-center gap-2.5 px-5 h-16 border-b">
        <GraphMark />
        <span className="font-display text-[15px] font-semibold tracking-tight">
          Enterprise<span className="text-signal">IQ</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-0.5 p-3">
        {LINKS.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`group rounded-lg px-3 py-2 transition-colors ${
                active ? "bg-signal-soft" : "hover:bg-paper"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${active ? "text-signal-ink" : "text-ink"}`}>
                  {l.label}
                </span>
                {active && <span className="size-1.5 rounded-full bg-signal" />}
              </div>
              <span className="text-[11px] text-faint">{l.hint}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 text-[11px] leading-relaxed text-faint border-t">
        <span className="eyebrow">stack</span>
        <p className="mt-1.5 font-mono text-[10.5px] text-muted">
          Aurora PostgreSQL
          <br />
          pgvector + pgrouting
          <br />
          Next.js · Vercel · OpenAI
        </p>
      </div>
    </aside>
  );
}

/** Node-edge glyph — the structural signature, in miniature. */
function GraphMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path d="M5 16 L11 6 L17 14" stroke="var(--color-signal)" strokeWidth="1.4" />
      <circle cx="5" cy="16" r="2.4" fill="var(--color-surface)" stroke="var(--color-ink)" strokeWidth="1.4" />
      <circle cx="11" cy="6" r="2.4" fill="var(--color-signal)" />
      <circle cx="17" cy="14" r="2.4" fill="var(--color-surface)" stroke="var(--color-prov)" strokeWidth="1.4" />
    </svg>
  );
}
