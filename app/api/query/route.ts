import { NextRequest, NextResponse } from "next/server";
import { retrieve } from "@/lib/retrieve";
import { synthesizeAnswer } from "@/lib/openai";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const started = Date.now();
  try {
    const { question } = await req.json();
    if (!question || !question.trim()) {
      return NextResponse.json({ ok: false, error: "Ask a question." }, { status: 400 });
    }

    const { sources, facts, context } = await retrieve(question);
    const answer = await synthesizeAnswer(question, context);
    const latencyMs = Date.now() - started;

    const log = await query<{ id: number }>(
      `INSERT INTO query_logs (question, answer, retrieved_chunk_ids, graph_paths, latency_ms)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        question,
        answer,
        sources.map((s) => s.chunkId),
        JSON.stringify(facts),
        latencyMs,
      ],
    );

    return NextResponse.json({
      ok: true,
      queryLogId: log.rows[0].id,
      answer,
      sources,
      facts,
      latencyMs,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
