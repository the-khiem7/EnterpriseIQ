import { query, withTransaction } from "./db";
import { chunkText, approxTokens } from "./chunk";
import { embed, extractTriples, toVectorLiteral } from "./openai";

export interface IngestInput {
  title: string;
  text: string;
  sourceType?: string; // pdf | markdown | text
}

export interface IngestResult {
  documentId: number;
  chunks: number;
  triples: number;
}

/**
 * Full Connect + Structure pipeline for one document:
 *   1. create document row (status=processing)
 *   2. chunk -> for each chunk: embed + extract triples
 *   3. write chunk, upsert entities, insert edges (per-chunk transaction)
 *   4. mark document ready (or error)
 */
export async function ingestDocument(input: IngestInput): Promise<IngestResult> {
  const title = input.title.trim() || "Untitled";
  const sourceType = input.sourceType ?? "text";

  const doc = await query<{ id: number }>(
    `INSERT INTO documents (title, source_type, raw_text, status)
     VALUES ($1, $2, $3, 'processing') RETURNING id`,
    [title, sourceType, input.text],
  );
  const documentId = doc.rows[0].id;

  try {
    const chunks = chunkText(input.text);
    let tripleCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i];
      const [embedding, triples] = await Promise.all([
        embed(content),
        extractTriples(content),
      ]);

      await withTransaction(async (client) => {
        const chunkRes = await client.query<{ id: number }>(
          `INSERT INTO chunks (document_id, chunk_index, content, token_count, embedding)
           VALUES ($1, $2, $3, $4, $5::vector) RETURNING id`,
          [documentId, i, content, approxTokens(content), toVectorLiteral(embedding)],
        );
        const chunkId = chunkRes.rows[0].id;

        for (const t of triples) {
          const srcId = await upsertEntity(client, t.subject, t.subject_type);
          const dstId = await upsertEntity(client, t.object, t.object_type);
          await client.query(
            `INSERT INTO edges (src_id, dst_id, predicate, document_id, chunk_id, confidence)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [srcId, dstId, t.predicate, documentId, chunkId, t.confidence],
          );
          tripleCount++;
        }
      });
    }

    await query(`UPDATE documents SET status = 'ready' WHERE id = $1`, [documentId]);
    return { documentId, chunks: chunks.length, triples: tripleCount };
  } catch (err) {
    await query(`UPDATE documents SET status = 'error', error = $2 WHERE id = $1`, [
      documentId,
      err instanceof Error ? err.message : String(err),
    ]);
    throw err;
  }
}

// Upsert returns the entity id whether it already existed or not.
async function upsertEntity(
  client: { query: (q: string, p?: unknown[]) => Promise<{ rows: { id: number }[] }> },
  name: string,
  type: string,
): Promise<number> {
  const res = await client.query(
    `INSERT INTO entities (name, type) VALUES ($1, $2)
     ON CONFLICT (name, type) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [name.trim(), type.trim() || "Entity"],
  );
  return res.rows[0].id;
}
