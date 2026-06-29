# EnterpriseIQ — Implementation Plan

> Living build plan. Doubles as the spec for the app and the checklist for the
> DevPost submission mirrored in `docs/devpost/`.

## Locked decisions

| Decision | Choice | Source |
|---|---|---|
| Goal | Build for real (full quality), not racing the clock | user |
| Track | **Track 4 — Open Innovation** (form corrected from B2C) | user |
| Product | Enterprise GraphRAG "Company Brain" — **unchanged** | README / brainstorming |
| Frontend + deploy | Next.js (App Router) on **Vercel** | rules |
| Database | **Amazon Aurora PostgreSQL** (single engine) | rules / README |
| Graph layer | **`pgrouting` + recursive SQL** over an edge-list (NOT Apache AGE) | Decision C |
| Vector | **`pgvector`** (co-located in same Aurora) | README |
| LLM + embeddings | **OpenAI** — `gpt-4o` (extract/synthesize) + `text-embedding-3-small` (1536-dim) | user |
| DB auth | Vercel OIDC → AWS IAM (`@aws-sdk/rds-signer`), passwordless | rules / technical points |

### Decision log — why the graph layer is `pgrouting` + recursive SQL (Option C)
- **Apache AGE cannot run on Aurora.** Verified against the official AWS
  extension allowlists: `age` is absent from *both* Aurora PostgreSQL and RDS for
  PostgreSQL (all versions). AWS only permits allowlisted extensions, so
  `CREATE EXTENSION age;` fails. pg_tle can't host AGE (C extension); self-managed
  Postgres on EC2 would break the "must use Aurora" rule.
- **We don't need AGE for GraphRAG.** A knowledge graph is nodes + edges. Postgres
  models that as an edge-list table; multi-hop = `WITH RECURSIVE`; and
  **`pgrouting` 3.8.0 is on the Aurora allowlist** → real graph algorithms
  (shortest path, k-hop, connectivity) natively in Aurora.
- **Best fit for the business logic.** EnterpriseIQ needs open-ended ad-hoc
  multi-hop traversal, auditable paths, and strong consistency (compliance:
  always cite the *latest approved* version). A single ACID engine returns the
  path + source chunks in one consistent snapshot — beating a multi-store design
  on exactly the criteria that define the product.
- **Strongest narrative for AWS DB judges:** one Aurora engine unifies relational
  + vector + graph; scale-to-zero cost; no separate graph DB to operate.

### Open flags (not blocking the build)
- **Eligibility:** form lists Country = **Vietnam**, an excluded country in the
  official rules. Building is fine; prize eligibility needs an eligible
  Representative. Confirm before final submit.
- **Hashtag typo:** form mirror says `#H10Hackathon`; the real tag is
  **`#H0Hackathon`**. Fix in any bonus content.
- **App Status = "Existing":** form requires a written "what we updated during
  the submission period" note. Draft once the build is real.

---

## Architecture

```
Browser ──> Vercel (Next.js App Router)
              ├─ UI (React, Tailwind, shadcn/ui)
              ├─ Route Handlers / Server Actions  (ingest, query, feedback)
              └─ AWS SDK ── OIDC→STS→IAM auth token (rds-signer)
                              │
                              ▼
            Amazon Aurora PostgreSQL (Serverless v2, scale-to-zero)
              ├─ Relational      (documents, chunks, entities, edges, query_logs, feedback)
              ├─ pgvector        (chunks.embedding, HNSW cosine)
              └─ pgrouting + WITH RECURSIVE  (multi-hop traversal over edges)

External: OpenAI API (gpt-4o extraction/synthesis, text-embedding-3-small)
```

One database engine holds relational + vector + graph — that co-location is the
core "why this stack" story for the AWS judges.

---

## Data model

**Relational + graph (all in Aurora)**
- `documents` — id, title, source_type, raw_text, status (`processing|ready|error`), created_at
- `chunks` — id, document_id (fk), chunk_index, content, token_count, embedding `vector(1536)`, feedback_score (default 0)
- `entities` — id, name, type, canonical_name; `UNIQUE (name, type)` to dedupe nodes
- `edges` — id, src_id (fk entities), dst_id (fk entities), predicate, document_id, chunk_id, confidence  *(this IS the graph; also the audit record of extraction)*
- `query_logs` — id, question, answer, retrieved_chunk_ids[], graph_paths(jsonb), latency_ms, created_at
- `feedback` — id, query_log_id (fk), rating (`+1|-1`), note, created_at

**pgvector index**
```sql
CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops);
```

**Graph traversal — two complementary tools, no extra engine**
- **`WITH RECURSIVE`** for k-hop neighbourhood expansion from seed entities
  (the GraphRAG subgraph retrieval workhorse).
- **`pgrouting`** for explainable path-finding between entities
  (e.g. policy → versions → approver chains): `pgr_dijkstra` / `pgr_bfs` over an
  `edges_pgr(id, source, target, cost, reverse_cost)` view.
- Index `edges(src_id)` and `edges(dst_id)` for fast traversal both directions.

---

## GraphRAG pipeline (Connect → Structure → Reason → Learn)

**1. Connect (ingest)** — `POST /api/ingest`
- Accept PDF / markdown / pasted text. PDF → text via `pdf-parse`.
- Insert `documents` (status=processing). Chunk (~600 tokens, ~80 overlap) → `chunks`.

**2. Structure (extract)** — per chunk
- OpenAI structured-output call → array of triples `{subject, subject_type, predicate, object, object_type, confidence}` (validate with `zod`).
- `text-embedding-3-small` → write `chunks.embedding`.
- Upsert nodes into `entities` (`ON CONFLICT (name,type) DO NOTHING`) and insert `edges` rows. Set `documents.status = ready`.

**3. Reason (query)** — `POST /api/query`
- Embed question → pgvector ANN → top-K seed chunks + their entities.
- From seed entities, `WITH RECURSIVE` 1–2 hop expansion → relevant subgraph; optionally `pgr_dijkstra` to surface the explicit path for "who/what chain" questions.
- Build context = chunk snippets + serialized graph paths → `gpt-4o` synthesizes answer that **cites** chunks + paths.
- Return `{answer, sources[], paths[], sql}` and write `query_logs`.
- UI shows an **Audit Trail** panel (source snippets + entity paths + the exact SQL that ran) — explainability is the anti-hallucination selling point.

**4. Learn (feedback)** — `POST /api/feedback`
- 👍/👎 + optional note → `feedback`. Adjust `chunks.feedback_score`; factor it
  into ranking (`distance − w·feedback_score`). Simple but real.

---

## UI (pages)

1. **Documents** — upload, list with live ingestion status, re-process.
2. **Ask** — question box, streamed answer, expandable Audit Trail.
3. **Graph Explorer** — force-directed graph (`react-force-graph`) of entities/edges read straight from `entities`/`edges`; click a node → connected docs.
4. **Status** (small) — DB connectivity + IAM-auth mode; "seed sample data" button.

---

## Tech stack / key libraries

- `next` (App Router, TS), `tailwindcss`, `shadcn/ui`, `lucide-react`
- `pg` (node-postgres) with a pooled connection wrapper (no special per-connection setup needed — plain SQL, unlike AGE)
- `@aws-sdk/rds-signer`, `@vercel/functions` (OIDC) for passwordless auth
- `openai` SDK
- `pdf-parse`, `react-force-graph-2d`, `zod` (validate LLM structured output)
- DB extensions: `vector` (pgvector), `pgrouting`

---

## Build phases

- **P0 — Provision & scaffold:** Aurora PG Serverless v2 (scale-to-zero) via Vercel Marketplace AWS integration; `CREATE EXTENSION vector; CREATE EXTENSION pgrouting;` (both allowlisted — low risk); Next.js app; deploy hello-world to Vercel; wire OIDC/IAM auth.
- **P1 — DB layer:** migrations for all tables + HNSW index + edge indexes + `edges_pgr` view; connection wrapper; `/api/status` healthcheck.
- **P2 — Ingest (Connect+Structure):** upload + chunk + extract triples + embed + write entities/edges. Documents page.
- **P3 — Query (Reason):** hybrid vector + recursive-CTE/pgrouting retrieval + synthesis + audit trail. Ask page.
- **P4 — Graph Explorer:** read `entities`/`edges` → force-directed viz.
- **P5 — Learn:** feedback capture + ranking adjustment.
- **P6 — Harden & deploy:** IAM auth in prod, error states, env config, cold-start warm path for demo.
- **P7 — Submission assets:** seed demo dataset (the VIP-refund scenario); record <3-min video; draw.io architecture diagram (AWS icons); AWS/Vercel storage screenshot; fill every `docs/devpost/` field; "what we updated" note.

---

## Key technical risks (verify early)

1. **Extension availability** — `vector` and `pgrouting` are both on the Aurora
   allowlist (verified), so `CREATE EXTENSION` should succeed at P0. Still
   confirm versions on the chosen Aurora PG major version.
2. **Recursive-CTE depth/perf** — cap traversal depth (1–2 hops, with a hard
   limit) and add a visited-set to avoid cycles; index `edges(src_id)`/`(dst_id)`.
   At demo scale this is fast; document the depth cap so it's an explicit design
   choice, not a silent limit.
3. **Serverless cold starts vs Aurora** — Aurora Serverless v2 auto-pause (scale
   to 0 ACU) is cheap but adds resume latency; keep a warm path for the live demo.
4. **OIDC→IAM token lifetime** — rds-signer tokens are short-lived (~15 min);
   generate per-connection, don't cache long.

---

## Submission deliverables (maps to `docs/devpost/`)

| Requirement | File / field | Status |
|---|---|---|
| Track = Open Innovation | `Additional info.md` | ✅ corrected |
| Database = Amazon Aurora | `Additional info.md` → "Which database" | ☐ select |
| Live Vercel URL | `Additional info.md` + `Project details.md` | ☐ after deploy |
| Vercel Team ID (`team_xxxxx`) | `Additional info.md` | ☐ |
| Architecture diagram (png/pdf) | `Additional info.md` | ☐ build in P7 |
| AWS DB usage screenshot | `Additional info.md` | ☐ build in P7 |
| <3-min demo video (public YouTube) | `Project details.md` | ☐ build in P7 |
| Project name + elevator pitch | `Project overview.md` | ☐ |
| Project story (inspiration/built/learned/challenges) | `Project details.md` | ☐ |
| Built-with tags expanded | `Project details.md` | ☐ add next.js, postgresql, pgvector, pgrouting, openai, typescript |
| "What we updated" (App Status=Existing) | `Additional info.md` | ☐ draft |
| Bonus content w/ `#H0Hackathon` | optional | ☐ optional (+0.2 each, max +0.6) |
