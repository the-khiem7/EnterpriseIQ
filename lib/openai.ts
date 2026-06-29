import OpenAI from "openai";
import { TripleExtractionSchema, type Triple } from "./triples";

let client: OpenAI | undefined;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("Missing OPENAI_API_KEY (see .env.example).");
    client = new OpenAI({ apiKey });
  }
  return client;
}

export const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
export const EMBEDDING_DIM = 1536;
export const CHAT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

/** Embed a single string; returns a 1536-dim vector. */
export async function embed(text: string): Promise<number[]> {
  const res = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });
  return res.data[0].embedding;
}

const EXTRACTION_SYSTEM = `You extract a knowledge graph from enterprise documents.
Return STRICT JSON: {"triples":[{"subject","subject_type","predicate","object","object_type","confidence"}]}.
Rules:
- Each triple is a factual Subject–Predicate–Object relationship stated in the text.
- subject_type/object_type are short labels (Person, Policy, Document, Org, Date, Amount, Project, Decision, etc.).
- predicate is a short verb phrase (approved_by, supersedes, effective_from, owns, reports_to, references...).
- confidence in [0,1]. Only include facts actually supported by the text. No speculation.
- Prefer canonical entity names; resolve pronouns to their referent when clear.
- Max 40 triples per chunk. If none, return {"triples":[]}.`;

/** Extract S-P-O triples from a chunk. Returns [] on failure (non-fatal). */
export async function extractTriples(content: string): Promise<Triple[]> {
  try {
    const res = await getClient().chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM },
        { role: "user", content },
      ],
    });
    const raw = res.choices[0]?.message?.content ?? "{}";
    const parsed = TripleExtractionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.triples : [];
  } catch (err) {
    console.error("[openai] extractTriples failed:", err);
    return [];
  }
}

/** Synthesize a grounded answer from retrieved context. */
export async function synthesizeAnswer(
  question: string,
  context: string,
): Promise<string> {
  const res = await getClient().chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `You are EnterpriseIQ, a knowledge-graph assistant. Answer ONLY from the provided context (source chunks + graph paths). Cite chunk ids like [#12] inline. If the context is insufficient, say so plainly — never invent facts. Be concise and precise.`,
      },
      { role: "user", content: `Question: ${question}\n\nContext:\n${context}` },
    ],
  });
  return res.choices[0]?.message?.content ?? "";
}

/** Format a JS number[] as a pgvector literal: [0.1,0.2,...] */
export function toVectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}
