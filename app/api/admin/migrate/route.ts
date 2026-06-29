import { NextRequest, NextResponse } from "next/server";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// One-shot migration runner for serverless deploys, where the DB is inside a VPC
// and unreachable from a laptop. Guarded by MIGRATE_SECRET.
//   curl -X POST https://<app>/api/admin/migrate -H "x-migrate-secret: <secret>"
export async function POST(req: NextRequest) {
  const secret = process.env.MIGRATE_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "MIGRATE_SECRET not set." }, { status: 403 });
  }
  const provided =
    req.headers.get("x-migrate-secret") ?? new URL(req.url).searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS _migrations (
         name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    );
    const dir = join(process.cwd(), "db", "migrations");
    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
    const { rows } = await client.query("SELECT name FROM _migrations");
    const applied = new Set(rows.map((r) => r.name));

    const ran: string[] = [];
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await readFile(join(dir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        ran.push(file);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
    return NextResponse.json({ ok: true, applied: ran, skipped: [...applied] });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
