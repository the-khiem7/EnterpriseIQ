import { NextRequest, NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";

export const dynamic = "force-dynamic";

// Records 👍/👎 on an answer and folds the signal into retrieval ranking:
// every source chunk behind the answer gets its feedback_score nudged, so
// future pgvector ranking (distance − w·feedback_score) favours/penalises it.
export async function POST(req: NextRequest) {
  try {
    const { queryLogId, rating, note } = await req.json();
    if (rating !== 1 && rating !== -1) {
      return NextResponse.json({ ok: false, error: "rating must be 1 or -1." }, { status: 400 });
    }
    if (!queryLogId) {
      return NextResponse.json({ ok: false, error: "queryLogId required." }, { status: 400 });
    }

    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO feedback (query_log_id, rating, note) VALUES ($1, $2, $3)`,
        [queryLogId, rating, note ?? null],
      );
      // Apply the signal to the chunks that produced this answer.
      await client.query(
        `UPDATE chunks SET feedback_score = feedback_score + $1
          WHERE id = ANY(
            SELECT unnest(retrieved_chunk_ids) FROM query_logs WHERE id = $2
          )`,
        [rating, queryLogId],
      );
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
