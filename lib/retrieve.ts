import { query } from "./db";
import { embed, toVectorLiteral } from "./openai";

export interface SourceChunk {
  chunkId: number;
  documentId: number;
  title: string;
  snippet: string;
  score: number;
}

export interface GraphFact {
  subject: string;
  subjectType: string;
  predicate: string;
  object: string;
  objectType: string;
  chunkId: number | null;
}

export interface Retrieval {
  sources: SourceChunk[];
  facts: GraphFact[];
  context: string;
}

const SEED_K = 6;
const MAX_HOPS = 2;

/**
 * Hybrid GraphRAG retrieval:
 *   1. pgvector ANN  -> seed chunks
 *   2. seed chunks   -> seed entities (via edges anchored to those chunks)
 *   3. recursive CTE -> expand the entity neighbourhood up to MAX_HOPS
 *   4. collect the subgraph edges among reachable entities -> graph facts
 * Returns sources + facts + a serialized context block for the LLM.
 */
export async function retrieve(question: string): Promise<Retrieval> {
  const qvec = toVectorLiteral(await embed(question));

  // 1. vector seed chunks (feedback-aware ranking)
  const seed = await query<{
    id: number;
    document_id: number;
    title: string;
    content: string;
    score: number;
  }>(
    `SELECT c.id, c.document_id, d.title, c.content,
            1 - (c.embedding <=> $1::vector) AS score
       FROM chunks c JOIN documents d ON d.id = c.document_id
      WHERE c.embedding IS NOT NULL
      ORDER BY (c.embedding <=> $1::vector) - c.feedback_score * 0.05
      LIMIT $2`,
    [qvec, SEED_K],
  );

  const sources: SourceChunk[] = seed.rows.map((r) => ({
    chunkId: r.id,
    documentId: r.document_id,
    title: r.title,
    snippet: r.content.length > 320 ? r.content.slice(0, 320) + "…" : r.content,
    score: Number(r.score),
  }));

  const seedChunkIds = sources.map((s) => s.chunkId);
  let facts: GraphFact[] = [];

  if (seedChunkIds.length > 0) {
    // 2 + 3. seed entities from those chunks, expanded MAX_HOPS over the graph.
    // 4. return the subgraph edges among all reachable entities.
    const sub = await query<{
      subject: string;
      subject_type: string;
      predicate: string;
      object: string;
      object_type: string;
      chunk_id: number | null;
    }>(
      `WITH RECURSIVE seed_entities AS (
         SELECT src_id AS id FROM edges WHERE chunk_id = ANY($1::bigint[])
         UNION
         SELECT dst_id FROM edges WHERE chunk_id = ANY($1::bigint[])
       ),
       reachable AS (
         SELECT id, 0 AS depth FROM seed_entities
         UNION
         SELECT CASE WHEN e.src_id = r.id THEN e.dst_id ELSE e.src_id END, r.depth + 1
           FROM reachable r
           JOIN edges e ON (e.src_id = r.id OR e.dst_id = r.id)
          WHERE r.depth < $2
       )
       SELECT DISTINCT s.name AS subject, s.type AS subject_type, e.predicate,
              o.name AS object, o.type AS object_type, e.chunk_id
         FROM edges e
         JOIN entities s ON s.id = e.src_id
         JOIN entities o ON o.id = e.dst_id
        WHERE e.src_id IN (SELECT id FROM reachable)
          AND e.dst_id IN (SELECT id FROM reachable)
        ORDER BY e.predicate`,
      [seedChunkIds, MAX_HOPS],
    );

    facts = sub.rows.map((r) => ({
      subject: r.subject,
      subjectType: r.subject_type,
      predicate: r.predicate,
      object: r.object,
      objectType: r.object_type,
      chunkId: r.chunk_id,
    }));
  }

  const context = buildContext(sources, facts);
  return { sources, facts, context };
}

function buildContext(sources: SourceChunk[], facts: GraphFact[]): string {
  const chunkBlock = sources
    .map((s) => `[#${s.chunkId}] (${s.title}) ${s.snippet}`)
    .join("\n");
  const factBlock = facts
    .map((f) => `(${f.subject}) -[${f.predicate}]-> (${f.object})` + (f.chunkId ? ` [#${f.chunkId}]` : ""))
    .join("\n");

  return [
    "SOURCE CHUNKS:",
    chunkBlock || "(none)",
    "",
    "KNOWLEDGE GRAPH FACTS (multi-hop):",
    factBlock || "(none)",
  ].join("\n");
}
