export default function AskPage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <span className="eyebrow">reason</span>
      <h1 className="mt-2 text-2xl">Ask</h1>
      <p className="mt-1.5 text-sm text-muted max-w-xl">
        Hybrid retrieval — pgvector seeds + recursive graph traversal — with an auditable answer.
        Built in phase P3.
      </p>
      <div className="card p-8 mt-8 text-center text-sm text-faint">
        Coming next: the question box, streamed grounded answer, and the Audit Trail panel.
      </div>
    </div>
  );
}
