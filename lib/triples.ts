import { z } from "zod";

/** A Subject–Predicate–Object fact extracted from a chunk (NER + relation). */
export const TripleSchema = z.object({
  subject: z.string().min(1).max(200),
  subject_type: z.string().min(1).max(60).default("Entity"),
  predicate: z.string().min(1).max(80),
  object: z.string().min(1).max(200),
  object_type: z.string().min(1).max(60).default("Entity"),
  confidence: z.number().min(0).max(1).default(0.8),
});

export type Triple = z.infer<typeof TripleSchema>;

export const TripleExtractionSchema = z.object({
  triples: z.array(TripleSchema).max(40),
});

export type TripleExtraction = z.infer<typeof TripleExtractionSchema>;
