import Link from "next/link";

export default function Home() {
  return (
    <div className="px-8 py-14 lg:py-20">
      <div className="mx-auto max-w-5xl grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
        {/* Thesis */}
        <div>
          <span className="eyebrow">GraphRAG · Amazon Aurora PostgreSQL</span>
          <h1 className="mt-4 text-[2.6rem] leading-[1.05] font-display font-semibold tracking-tight">
            The questions standard RAG{" "}
            <span className="text-signal">can&apos;t</span> answer.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-muted max-w-md">
            Enterprise knowledge is scattered across PDFs, Slack, email and tribal memory. Vector
            search finds <em>similar</em> text — it can&apos;t connect entities or trace a chain of
            decisions. EnterpriseIQ builds a knowledge graph and a vector index in{" "}
            <strong className="text-ink">one Aurora engine</strong>, so every answer is multi-hop
            and fully auditable.
          </p>
          <div className="mt-7 flex gap-3">
            <Link href="/ask" className="btn btn-primary">
              Ask a question
            </Link>
            <Link href="/documents" className="btn btn-ghost">
              Ingest documents
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            <span className="chip">pgvector</span>
            <span className="chip">pgrouting</span>
            <span className="chip">WITH RECURSIVE</span>
            <span className="chip">openai</span>
          </div>
        </div>

        {/* Specimen: a traced, cited answer — the signature moment */}
        <div className="card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="size-2 rounded-full bg-signal" />
            <span className="eyebrow">traced answer</span>
          </div>

          <p className="font-display text-[15px] leading-snug mb-4">
            “How did the VIP refund policy change after Q3, and who approved the final version?”
          </p>

          {/* graph path */}
          <div className="rounded-lg bg-paper border p-3 mb-4">
            <span className="eyebrow text-[9px]">graph path · pgrouting</span>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
              <span className="chip">Policy:VIP-Refund</span>
              <Edge label="superseded_by" />
              <span className="chip">Policy:VIP-Refund-v3</span>
              <Edge label="approved_by" />
              <span
                className="chip"
                style={{ borderColor: "var(--color-prov)", color: "var(--color-prov)" }}
              >
                Person:M.&nbsp;Tran
              </span>
            </div>
          </div>

          {/* grounded answer */}
          <p className="text-[13px] leading-relaxed text-ink">
            After Q3, the refund window for VIP customers was extended from 30 to 60 days{" "}
            <Cite n={12} />. The final version (v3) was approved by{" "}
            <span className="text-prov font-medium">M. Tran, Head of Compliance</span> <Cite n={27} />.
          </p>

          <div className="mt-4 pt-3 border-t flex items-center justify-between">
            <span className="text-[11px] text-faint">2 source chunks · 1 graph path</span>
            <span className="eyebrow text-[9px]">auditable</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Edge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-faint">
      <span className="w-3 border-t" />
      <span className="text-[9px]">{label}</span>
      <span className="w-3 border-t" />
    </span>
  );
}

function Cite({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center font-mono text-[10px] text-signal align-super">
      [#{n}]
    </span>
  );
}
