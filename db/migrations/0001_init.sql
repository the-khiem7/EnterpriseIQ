-- EnterpriseIQ — initial schema
-- One Aurora PostgreSQL engine: relational + pgvector + pgrouting/recursive graph.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgrouting;   -- pulls in postgis-free pgRouting core

-- ── Documents & chunks ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'text',          -- pdf | markdown | text
  raw_text    TEXT,
  status      TEXT NOT NULL DEFAULT 'processing',     -- processing | ready | error
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chunks (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  document_id    BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index    INT NOT NULL,
  content        TEXT NOT NULL,
  token_count    INT,
  embedding      vector(1536),                        -- OpenAI text-embedding-3-small
  feedback_score REAL NOT NULL DEFAULT 0,
  UNIQUE (document_id, chunk_index)
);

-- ANN index for vector similarity (cosine).
CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw
  ON chunks USING hnsw (embedding vector_cosine_ops);

-- ── Knowledge graph: entities + edges ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS entities (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name           TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'Entity',
  canonical_name TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, type)
);

CREATE TABLE IF NOT EXISTS edges (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  src_id      BIGINT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  dst_id      BIGINT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  predicate   TEXT NOT NULL,
  document_id BIGINT REFERENCES documents(id) ON DELETE CASCADE,
  chunk_id    BIGINT REFERENCES chunks(id) ON DELETE SET NULL,
  confidence  REAL NOT NULL DEFAULT 1.0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Traversal indexes (both directions).
CREATE INDEX IF NOT EXISTS edges_src_idx ON edges (src_id);
CREATE INDEX IF NOT EXISTS edges_dst_idx ON edges (dst_id);

-- pgRouting expects integer id/source/target/cost columns. This view adapts the
-- edge-list and makes traversal bidirectional (reverse_cost set).
CREATE OR REPLACE VIEW edges_pgr AS
  SELECT id,
         src_id::bigint AS source,
         dst_id::bigint AS target,
         1.0::float8    AS cost,
         1.0::float8    AS reverse_cost
  FROM edges;

-- ── Query logs & feedback (audit + Learn loop) ──────────────────────────────
CREATE TABLE IF NOT EXISTS query_logs (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question           TEXT NOT NULL,
  answer             TEXT,
  retrieved_chunk_ids BIGINT[] NOT NULL DEFAULT '{}',
  graph_paths        JSONB,
  latency_ms         INT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  query_log_id BIGINT NOT NULL REFERENCES query_logs(id) ON DELETE CASCADE,
  rating       SMALLINT NOT NULL CHECK (rating IN (-1, 1)),
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
