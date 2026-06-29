"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface DocRow {
  id: number;
  title: string;
  source_type: string;
  status: string;
  error: string | null;
  created_at: string;
  chunk_count: number;
  edge_count: number;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [mode, setMode] = useState<"paste" | "file">("paste");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.ok) setDocs(data.documents);
      else setError(data.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll while anything is still processing.
  useEffect(() => {
    if (!docs.some((d) => d.status === "processing")) return;
    const t = setInterval(refresh, 2500);
    return () => clearInterval(t);
  }, [docs, refresh]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      let res: Response;
      if (mode === "file") {
        const file = fileRef.current?.files?.[0];
        if (!file) throw new Error("Choose a PDF, .md or .txt file first.");
        const fd = new FormData();
        fd.append("file", file);
        if (title) fd.append("title", title);
        res = await fetch("/api/ingest", { method: "POST", body: fd });
      } else {
        if (!text.trim()) throw new Error("Paste some text to ingest.");
        res = await fetch("/api/ingest", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title, text, sourceType: "text" }),
        });
      }
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Ingest failed.");
      setText("");
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <header className="mb-8">
        <span className="eyebrow">connect &amp; structure</span>
        <h1 className="mt-2 text-2xl">Documents</h1>
        <p className="mt-1.5 text-sm text-muted max-w-xl">
          Ingest a document and EnterpriseIQ extracts entity triples into the knowledge graph and
          embeddings into pgvector — the raw material for multi-hop, auditable answers.
        </p>
      </header>

      {/* Ingest card */}
      <div className="card p-5 mb-8">
        <div className="flex gap-1 mb-4">
          {(["paste", "file"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${
                mode === m ? "bg-signal-soft text-signal-ink" : "text-muted hover:bg-paper"
              }`}
            >
              {m === "paste" ? "Paste text" : "Upload file"}
            </button>
          ))}
        </div>

        <input
          className="field mb-3"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {mode === "paste" ? (
          <textarea
            className="field min-h-40 font-mono text-[13px] leading-relaxed"
            placeholder="Paste a policy, contract, memo, or notes…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        ) : (
          <input ref={fileRef} type="file" accept=".pdf,.md,.txt,.markdown" className="field" />
        )}

        <div className="flex items-center justify-between mt-4">
          <span className="text-[11px] text-faint">
            Extraction runs OpenAI per chunk — large docs take a moment.
          </span>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? "Ingesting…" : "Ingest document"}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-[color:var(--color-danger)] font-mono">{error}</p>
        )}
      </div>

      {/* List */}
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-display font-semibold">Ingested ({docs.length})</h2>
        <button className="text-xs text-muted hover:text-ink" onClick={refresh}>
          Refresh
        </button>
      </div>

      {!loaded ? (
        <p className="text-sm text-faint">Loading…</p>
      ) : docs.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-muted">No documents yet.</p>
          <p className="text-xs text-faint mt-1">Ingest your first document above to build the graph.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {docs.map((d) => (
            <li key={d.id} className="card px-4 py-3 flex items-center gap-4">
              <StatusDot status={d.status} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{d.title}</span>
                  <span className="chip">{d.source_type}</span>
                </div>
                {d.error ? (
                  <span className="text-xs text-[color:var(--color-danger)] font-mono">{d.error}</span>
                ) : (
                  <span className="text-[11px] text-faint font-mono">
                    {d.chunk_count} chunks · {d.edge_count} edges
                  </span>
                )}
              </div>
              <span className="text-[11px] text-faint shrink-0">
                {new Date(d.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string; pulse?: boolean }> = {
    ready: { color: "var(--color-signal)", label: "ready" },
    processing: { color: "var(--color-prov)", label: "processing", pulse: true },
    error: { color: "var(--color-danger)", label: "error" },
  };
  const s = map[status] ?? { color: "var(--color-faint)", label: status };
  return (
    <span className="flex items-center gap-1.5 shrink-0" title={s.label}>
      <span
        className={`size-2 rounded-full ${s.pulse ? "animate-pulse" : ""}`}
        style={{ background: s.color }}
      />
    </span>
  );
}
