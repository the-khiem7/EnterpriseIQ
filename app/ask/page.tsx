"use client";

import { useState } from "react";

interface SourceChunk {
  chunkId: number;
  documentId: number;
  title: string;
  snippet: string;
  score: number;
}
interface GraphFact {
  subject: string;
  subjectType: string;
  predicate: string;
  object: string;
  objectType: string;
  chunkId: number | null;
}
interface QueryResult {
  ok: boolean;
  queryLogId?: number;
  answer?: string;
  sources?: SourceChunk[];
  facts?: GraphFact[];
  latencyMs?: number;
  error?: string;
}

const EXAMPLES = [
  "How did the VIP refund policy change after Q3, and who approved the final version?",
  "What sign-off is required for large refunds?",
];

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [feedback, setFeedback] = useState<null | 1 | -1>(null);

  async function sendFeedback(rating: 1 | -1) {
    if (!result?.queryLogId || feedback) return;
    setFeedback(rating);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ queryLogId: result.queryLogId, rating }),
      });
    } catch {
      setFeedback(null);
    }
  }

  async function ask(q?: string) {
    const text = (q ?? question).trim();
    if (!text) return;
    setQuestion(text);
    setBusy(true);
    setResult(null);
    setFeedback(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      setResult(await res.json());
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <header className="mb-6">
        <span className="eyebrow">reason</span>
        <h1 className="mt-2 text-2xl">Ask</h1>
        <p className="mt-1.5 text-sm text-muted max-w-xl">
          pgvector finds the entry points; a recursive graph traversal connects them. Every answer
          carries its evidence.
        </p>
      </header>

      <div className="card p-4">
        <textarea
          className="field min-h-20 resize-none"
          placeholder="Ask a multi-hop question about your documents…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask();
          }}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-[11px] text-faint">⌘/Ctrl + Enter to ask</span>
          <button className="btn btn-primary" onClick={() => ask()} disabled={busy}>
            {busy ? "Reasoning…" : "Ask"}
          </button>
        </div>
      </div>

      {!result && !busy && (
        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => ask(ex)}
              className="text-left text-[12px] text-muted hover:text-ink border rounded-lg px-3 py-2 hover:bg-surface transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {busy && (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted">
          <span className="size-2 rounded-full bg-signal animate-pulse" />
          Seeding with pgvector · traversing the graph · synthesizing…
        </div>
      )}

      {result && !result.ok && (
        <p className="mt-6 text-sm text-[color:var(--color-danger)] font-mono">{result.error}</p>
      )}

      {result?.ok && (
        <div className="mt-6 space-y-5">
          {/* Answer */}
          <div className="card p-5">
            <span className="eyebrow">answer</span>
            <div className="mt-2 text-[15px] leading-relaxed">
              <AnswerText text={result.answer ?? ""} />
            </div>
            <div className="mt-4 pt-3 border-t flex items-center justify-between text-[11px] text-faint">
              <div className="flex items-center gap-4">
                <span>{result.sources?.length ?? 0} source chunks</span>
                <span>{result.facts?.length ?? 0} graph facts</span>
                <span>{result.latencyMs} ms</span>
              </div>
              <div className="flex items-center gap-2">
                {feedback ? (
                  <span className="text-muted">
                    {feedback === 1 ? "Thanks — marked helpful" : "Thanks — we'll improve this"}
                  </span>
                ) : (
                  <>
                    <span>Helpful?</span>
                    <button
                      onClick={() => sendFeedback(1)}
                      className="px-1.5 py-0.5 rounded hover:bg-signal-soft transition-colors"
                      aria-label="Helpful"
                      title="Helpful"
                    >
                      👍
                    </button>
                    <button
                      onClick={() => sendFeedback(-1)}
                      className="px-1.5 py-0.5 rounded hover:bg-paper transition-colors"
                      aria-label="Not helpful"
                      title="Not helpful"
                    >
                      👎
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Audit Trail — the signature */}
          <AuditTrail sources={result.sources ?? []} facts={result.facts ?? []} />
        </div>
      )}
    </div>
  );
}

/** Highlight [#id] citation tokens in the answer. */
function AnswerText({ text }: { text: string }) {
  const parts = text.split(/(\[#\d+\])/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\[#\d+\]$/.test(p) ? (
          <span key={i} className="font-mono text-[11px] text-signal align-super">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function AuditTrail({ sources, facts }: { sources: SourceChunk[]; facts: GraphFact[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-paper transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: "var(--color-prov)" }} />
          <span className="eyebrow">audit trail</span>
        </span>
        <span className="text-xs text-faint">{open ? "hide" : "show"}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5">
          {/* Graph facts */}
          <div>
            <span className="text-[11px] font-medium text-muted">Graph facts traversed</span>
            <div className="mt-2 flex flex-col gap-1.5">
              {facts.length === 0 && <span className="text-xs text-faint">No graph edges in scope.</span>}
              {facts.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  <span className="chip">{f.subject}</span>
                  <span className="inline-flex items-center gap-1 text-prov font-mono text-[10px]">
                    <span className="w-3 border-t" />
                    {f.predicate}
                    <span className="w-3 border-t" />
                  </span>
                  <span className="chip">{f.object}</span>
                  {f.chunkId && <span className="font-mono text-[10px] text-faint">[#{f.chunkId}]</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Source chunks */}
          <div>
            <span className="text-[11px] font-medium text-muted">Source chunks</span>
            <div className="mt-2 flex flex-col gap-2">
              {sources.map((s) => (
                <div key={s.chunkId} className="rounded-lg border bg-paper p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-signal">[#{s.chunkId}]</span>
                    <span className="text-[10px] text-faint">
                      {s.title} · {(s.score * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-ink">{s.snippet}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
