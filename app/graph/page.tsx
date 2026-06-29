"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GNode {
  id: number;
  name: string;
  type: string;
  degree: number;
  x?: number;
  y?: number;
}
interface GLink {
  source: number | GNode;
  target: number | GNode;
  predicate: string;
  document_id: number | null;
}

// Entity-type colour map, derived from the design tokens.
function colorFor(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("policy") || t.includes("document")) return "#0d7d86"; // signal
  if (t.includes("person")) return "#111821"; // ink
  if (t.includes("org") || t.includes("depart") || t.includes("team")) return "#a8530a"; // prov
  return "#8a96a2"; // faint
}

export default function GraphPage() {
  const [data, setData] = useState<{ nodes: GNode[]; links: GLink[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GNode | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/graph")
      .then((r) => r.json())
      .then((d) => (d.ok ? setData({ nodes: d.nodes, links: d.links }) : setError(d.error)))
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Relationships for the selected node (resolve link endpoints to ids).
  const relations = useMemo(() => {
    if (!selected || !data) return [];
    const idOf = (x: number | GNode) => (typeof x === "object" ? x.id : x);
    return data.links
      .filter((l) => idOf(l.source) === selected.id || idOf(l.target) === selected.id)
      .map((l) => {
        const outgoing = idOf(l.source) === selected.id;
        const otherId = outgoing ? idOf(l.target) : idOf(l.source);
        const other = data.nodes.find((n) => n.id === otherId);
        return { outgoing, predicate: l.predicate, other: other?.name ?? `#${otherId}` };
      });
  }, [selected, data]);

  const drawNode = useCallback(
    (node: GNode, ctx: CanvasRenderingContext2D, scale: number) => {
      const r = 3 + Math.min(node.degree, 8) * 0.7;
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI);
      ctx.fillStyle = colorFor(node.type);
      ctx.fill();
      if (selected?.id === node.id) {
        ctx.lineWidth = 2 / scale;
        ctx.strokeStyle = "#0a5a61";
        ctx.stroke();
      }
      if (scale > 1.3) {
        ctx.font = `${10 / scale}px ui-sans-serif, system-ui`;
        ctx.fillStyle = "#111821";
        ctx.textAlign = "center";
        ctx.fillText(node.name.slice(0, 28), node.x!, node.y! + r + 9 / scale);
      }
    },
    [selected],
  );

  return (
    <div className="flex flex-col h-screen">
      <header className="px-8 py-5 border-b shrink-0">
        <span className="eyebrow">explore</span>
        <div className="flex items-baseline justify-between">
          <h1 className="mt-1 text-2xl">Graph Explorer</h1>
          {data && (
            <span className="font-mono text-[11px] text-faint">
              {data.nodes.length} entities · {data.links.length} relationships
            </span>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <div ref={wrapRef} className="flex-1 min-w-0 relative">
          {error && (
            <p className="absolute inset-0 grid place-items-center text-sm text-[color:var(--color-danger)] font-mono">
              {error}
            </p>
          )}
          {data && data.nodes.length === 0 && (
            <p className="absolute inset-0 grid place-items-center text-sm text-faint">
              No entities yet — ingest a document first.
            </p>
          )}
          {data && data.nodes.length > 0 && (
            <ForceGraph2D
              graphData={data}
              width={size.w}
              height={size.h}
              backgroundColor="rgba(0,0,0,0)"
              nodeRelSize={4}
              nodeCanvasObject={drawNode as never}
              nodePointerAreaPaint={
                ((node: GNode, color: string, ctx: CanvasRenderingContext2D) => {
                  ctx.fillStyle = color;
                  ctx.beginPath();
                  ctx.arc(node.x!, node.y!, 8, 0, 2 * Math.PI);
                  ctx.fill();
                }) as never
              }
              linkColor={() => "#cbd3db"}
              linkDirectionalArrowLength={3}
              linkDirectionalArrowRelPos={1}
              linkLabel={((l: GLink) => l.predicate) as never}
              onNodeClick={((n: GNode) => setSelected(n)) as never}
              onBackgroundClick={() => setSelected(null)}
            />
          )}
        </div>

        {/* Detail drawer */}
        <aside className="w-72 shrink-0 border-l bg-surface/60 backdrop-blur p-5 overflow-y-auto">
          {!selected ? (
            <div className="text-sm text-faint">
              <p className="mb-3">Click a node to inspect its relationships.</p>
              <Legend />
            </div>
          ) : (
            <div>
              <span className="chip mb-2">{selected.type}</span>
              <h2 className="text-lg font-display font-semibold leading-tight">{selected.name}</h2>
              <p className="text-[11px] text-faint mt-1 font-mono">degree {selected.degree}</p>

              <div className="mt-4">
                <span className="text-[11px] font-medium text-muted">Relationships</span>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {relations.map((r, i) => (
                    <li key={i} className="text-[12px] leading-snug">
                      <span className="font-mono text-[10px] text-prov">
                        {r.outgoing ? "→" : "←"} {r.predicate}
                      </span>
                      <br />
                      <span className="text-ink">{r.other}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    { label: "Policy / Document", c: "#0d7d86" },
    { label: "Person", c: "#111821" },
    { label: "Org / Team", c: "#a8530a" },
    { label: "Other", c: "#8a96a2" },
  ];
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2 text-[11px] text-muted">
          <span className="size-2.5 rounded-full" style={{ background: i.c }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
