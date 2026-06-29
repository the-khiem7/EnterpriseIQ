import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Returns the knowledge graph as nodes + links for force-directed rendering.
// Capped for the client; the graph is small at hackathon scale.
const NODE_CAP = 500;
const LINK_CAP = 1200;

export async function GET() {
  try {
    const nodes = await query<{ id: number; name: string; type: string; degree: number }>(
      `SELECT e.id, e.name, e.type,
              (SELECT count(*) FROM edges x WHERE x.src_id = e.id OR x.dst_id = e.id)::int AS degree
         FROM entities e
        ORDER BY degree DESC
        LIMIT $1`,
      [NODE_CAP],
    );

    const links = await query<{
      source: number;
      target: number;
      predicate: string;
      document_id: number | null;
    }>(
      `SELECT src_id AS source, dst_id AS target, predicate, document_id
         FROM edges
        ORDER BY id
        LIMIT $1`,
      [LINK_CAP],
    );

    return NextResponse.json({
      ok: true,
      nodes: nodes.rows,
      links: links.rows,
      counts: { nodes: nodes.rows.length, links: links.rows.length },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 503 },
    );
  }
}
