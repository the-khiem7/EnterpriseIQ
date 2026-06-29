"use client";

import { useEffect, useState } from "react";

interface Status {
  ok: boolean;
  authMode?: string;
  extensions?: string[];
  hasVector?: boolean;
  hasPgrouting?: boolean;
  coreTables?: number;
  error?: string;
}

export default function StatusPage() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch((e) => setStatus({ ok: false, error: String(e) }));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <span className="eyebrow">system health</span>
      <h1 className="mt-2 text-2xl mb-6">Status</h1>

      {!status ? (
        <p className="text-sm text-faint">Checking…</p>
      ) : (
        <div className="card divide-y">
          <Row label="Database" ok={status.ok} value={status.ok ? "connected" : status.error ?? "error"} />
          <Row label="Auth mode" value={status.authMode ?? "—"} />
          <Row label="pgvector" ok={status.hasVector} value={status.hasVector ? "installed" : "missing"} />
          <Row label="pgrouting" ok={status.hasPgrouting} value={status.hasPgrouting ? "installed" : "missing"} />
          <Row
            label="Core tables"
            ok={(status.coreTables ?? 0) === 6}
            value={`${status.coreTables ?? 0}/6`}
          />
        </div>
      )}
      <p className="mt-4 text-[11px] text-faint">
        Expecting 6 core tables: documents, chunks, entities, edges, query_logs, feedback.
      </p>
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-muted">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-[13px]">{value}</span>
        {ok !== undefined && (
          <span
            className="size-2 rounded-full"
            style={{ background: ok ? "var(--color-signal)" : "var(--color-danger)" }}
          />
        )}
      </span>
    </div>
  );
}
