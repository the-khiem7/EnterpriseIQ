import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Healthcheck: confirms DB connectivity and that required extensions + core
// tables exist. Used during P0/P1 bring-up and by the Status page.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ext = await query<{ extname: string }>(
      `SELECT extname FROM pg_extension WHERE extname IN ('vector', 'pgrouting')`,
    );
    const extensions = ext.rows.map((r) => r.extname);

    const tables = await query<{ count: string }>(
      `SELECT count(*)::text AS count
         FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('documents','chunks','entities','edges','query_logs','feedback')`,
    );

    return NextResponse.json({
      ok: true,
      authMode: process.env.USE_IAM_AUTH === "true" ? "iam" : "connection-string",
      extensions,
      hasVector: extensions.includes("vector"),
      hasPgrouting: extensions.includes("pgrouting"),
      coreTables: Number(tables.rows[0]?.count ?? 0),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 503 },
    );
  }
}
