export default function GraphPage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <span className="eyebrow">explore</span>
      <h1 className="mt-2 text-2xl">Graph Explorer</h1>
      <p className="mt-1.5 text-sm text-muted max-w-xl">
        A force-directed view of entities and relationships in the knowledge graph. Built in phase P4.
      </p>
      <div className="card p-8 mt-8 text-center text-sm text-faint">
        Coming next: interactive entity/edge visualization with click-through to source documents.
      </div>
    </div>
  );
}
