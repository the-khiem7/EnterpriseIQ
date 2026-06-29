import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface DocumentRow {
  id: number;
  title: string;
  source_type: string;
  status: string;
  error: string | null;
  created_at: string;
  chunk_count: number;
  edge_count: number;
}

export async function GET() {
  try {
    const res = await query<DocumentRow>(
      `SELECT d.id, d.title, d.source_type, d.status, d.error, d.created_at,
              COUNT(DISTINCT c.id)::int AS chunk_count,
              COUNT(DISTINCT e.id)::int AS edge_count
         FROM documents d
         LEFT JOIN chunks c ON c.document_id = d.id
         LEFT JOIN edges  e ON e.document_id = d.id
        GROUP BY d.id
        ORDER BY d.created_at DESC`,
    );
    return NextResponse.json({ ok: true, documents: res.rows });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 503 },
    );
  }
}
