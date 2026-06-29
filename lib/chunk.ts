// Lightweight chunker. Splits on paragraph/sentence boundaries and packs into
// ~targetTokens windows with a small overlap. Token count is approximated as
// chars/4 to avoid a heavyweight tokenizer dependency — good enough for RAG.

const CHARS_PER_TOKEN = 4;

export interface ChunkOptions {
  targetTokens?: number;
  overlapTokens?: number;
}

export function chunkText(text: string, opts: ChunkOptions = {}): string[] {
  const targetChars = (opts.targetTokens ?? 600) * CHARS_PER_TOKEN;
  const overlapChars = (opts.overlapTokens ?? 80) * CHARS_PER_TOKEN;

  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];

  // Split into paragraphs, then sentences, so we never cut mid-sentence.
  const units = clean
    .split(/\n\s*\n/)
    .flatMap((p) => p.match(/[^.!?\n]+[.!?]*\s*/g) ?? [p])
    .map((u) => u.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const unit of units) {
    if (current && current.length + unit.length + 1 > targetChars) {
      chunks.push(current.trim());
      // start next chunk with a tail overlap from the previous one
      current = overlapChars > 0 ? current.slice(-overlapChars) + " " : "";
    }
    current += (current ? " " : "") + unit;
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

export function approxTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
