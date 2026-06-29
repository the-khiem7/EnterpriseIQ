# EnterpriseIQ — Implementation Roadmap & Progress Tracker

> **Single source of truth for build progress.** This file is designed to be
> resumed from cold — anyone (human or agent) can read *only* this file plus
> [`docs/project/IMPLEMENTATION_PLAN.md`](docs/project/IMPLEMENTATION_PLAN.md)
> and continue without conversation history.
>
> **Design spec lives in** `IMPLEMENTATION_PLAN.md` (architecture, data model,
> decision log). **Live status lives here.**

**Last updated:** 2026-06-29
**Current phase:** P6 — **Aurora live + migrated + IAM auth validated.** Remaining: Vercel deploy (user import).
**Next action:** user imports repo to Vercel + sets env (below) + deploys → I verify `/api/status` on live URL.

---

## How to resume (read this first)

1. Read the **Current phase / Next action** above and the **Session log** at the bottom.
2. Find the first unchecked `[ ]` task in the **Phase checklist** below — that's where to continue.
3. Do the task; when done, change `[ ]` → `[x]`, update **Last updated**, **Current phase**, **Next action**, and add a **Session log** row.
4. If a task is blocked or assumptions changed, note it in **Blockers / notes** rather than relying on memory.

**Status legend:** `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

---

## Phase checklist

### P0 — Provision & scaffold  `(status: in progress — code done, cloud pending)`
- [!] Provision **Aurora PostgreSQL Serverless v2** (scale-to-zero) via Vercel Marketplace AWS integration — *manual cloud step, awaiting account*
- [x] Enable extensions: `vector` + `pgrouting` (+`postgis`, required by pgrouting 3.x) — verified on local Docker PG16; all Aurora-allowlisted
- [x] Scaffold **Next.js** (App Router, TS, Tailwind v4) — Next 16.2.9 / React 19
- [x] Wire DB connection via **OIDC → AWS IAM** (`@aws-sdk/rds-signer`) + `DATABASE_URL` local fallback → `lib/db.ts`, `.env.example`
- [ ] Deploy hello-world to **Vercel**; confirm live `*.vercel.app` URL
- [ ] Capture **Vercel Team ID** (`team_xxxxx`) → record in `docs/devpost/Additional info.md`

### P1 — Database layer  `(status: code complete; live verification pending)`
- [x] Migrations: `documents`, `chunks`, `entities`, `edges`, `query_logs`, `feedback` → `db/migrations/0001_init.sql` + `scripts/migrate.mjs`
- [x] HNSW index on `chunks.embedding` (`vector_cosine_ops`); indexes on `edges(src_id)`, `edges(dst_id)`
- [x] `edges_pgr` view (`id, source, target, cost, reverse_cost`) for pgrouting
- [x] `pg` pooled connection wrapper → `lib/db.ts` (`getPool`, `query`, `withTransaction`)
- [x] `/api/status` healthcheck (DB connectivity + extensions present) → `app/api/status/route.ts`
- [x] **Verified live:** local Docker PG16 (pgvector+pgrouting+postgis); `npm run migrate` OK; `GET /api/status` → `ok, hasVector, hasPgrouting, coreTables:6`

### P2 — Ingest: Connect + Structure  `(status: code complete; live verification pending)`
- [x] `/api/ingest` — PDF (`unpdf`) / markdown / pasted text → `app/api/ingest/route.ts`
- [x] Chunking (~600 tok, ~80 overlap) → `lib/chunk.ts`
- [x] OpenAI triple extraction (`gpt-4o`, `zod`-validated) → `lib/openai.ts`, `lib/triples.ts`
- [x] OpenAI embeddings (`text-embedding-3-small`) → `chunks.embedding` (pgvector literal)
- [x] Upsert `entities` (`ON CONFLICT`) + insert `edges` → `lib/ingest.ts`
- [x] **Documents page** — upload (paste/file), list, polling status → `app/documents/page.tsx`
- [x] `/api/documents` list endpoint
- [x] **Verified live:** ingested sample memo → 1 chunk (embedded), 12 entities, 10 edges; `pgr_dijkstra` returned path `Policy v2 → v3 → Michael Tran` (the approver chain)

**Bonus this pass (design foundation):** "Evidence/Blueprint" design system in
`globals.css` (teal signal + amber provenance, Space Grotesk/Inter/JetBrains Mono);
app shell + nav (`app/components/app-nav.tsx`); thesis hero (`app/page.tsx`);
Status page (`app/status/page.tsx`); Ask/Graph placeholders. `npm run build` green.

### P3 — Query: Reason  `(status: verified live)`
- [x] `/api/query` — embed question → pgvector ANN seeds → `lib/retrieve.ts`
- [x] `WITH RECURSIVE` entity-neighbourhood expansion (depth cap 2, dedup) over `edges`
- [x] Assemble context (chunks + graph facts) → `gpt-4o` synthesis with `[#id]` citations
- [x] Write `query_logs`
- [x] **Ask page** + expandable **Audit Trail** panel (graph facts + source chunks) → `app/ask/page.tsx`
- [x] **Verified live:** demo question → correct multi-hop answer citing `[#1]`, 10 graph facts, 2.3s. `npm run build` green (10 routes).

> Note: sample corpus is a single doc, so multi-hop is within one chunk's extraction.
> Seed several linked docs in P7 to showcase **cross-document** multi-hop.

### P4 — Graph Explorer  `(status: code complete; API verified)`
- [x] `/api/graph` — entities + edges as nodes/links (degree-ranked, capped) → verified live (61 nodes / 68 links)
- [x] `react-force-graph-2d` viz (dynamic, ssr:false); type-coloured nodes, hover predicates, click → relationship drawer → `app/graph/page.tsx`
- [ ] Visual confirmation in browser at `/graph` (canvas can't be screenshotted from here)

### P5 — Learn: feedback  `(status: verified live)`
- [x] `/api/feedback` — 👍/👎 (+note) → `feedback`; bumps `chunks.feedback_score` for the answer's chunks → `app/api/feedback/route.ts`
- [x] Ranking already factors `feedback_score` in `lib/retrieve.ts` (`distance − 0.05·feedback_score`)
- [x] 👍/👎 wired into Ask page answer card
- [x] **Verified live:** query #3 + 👍 → feedback row inserted, chunks 1–3 `feedback_score` → 1. Build green.

### P6 — Harden & deploy  `(status: in progress)`
- [x] **Deploy runbook** → `docs/project/DEPLOY.md` (3 provision options, OIDC→IAM 3 tiers, SSL/CA, env map, verify) + `vercel.json`
- [x] **Code deploy-ready & pushed** to GitHub `main`: env-var tolerance + remote SSL in `lib/db.ts`; guarded `/api/admin/migrate`; `next.config` file tracing
- [x] **Provisioned via AWS CLI** (free-plan → `--with-express-configuration`, so **IAM-only** auth): cluster `enterpriseiq` (Aurora PG **17.7**, Serverless v2 0–4 ACU), instance `enterpriseiq-instance-1`, public. Endpoint `enterpriseiq.cluster-ctqkaawasuw5.us-east-2.rds.amazonaws.com`, resource id `cluster-LYNFXCQO2QOQFOERMGUJKTWFGA`.
- [x] **Migrated on Aurora**: created `enterpriseiq` DB + ran `0001` via IAM token (psql in the local container). vector/postgis/pgrouting + 6 tables verified.
- [x] **Auth = Tier B (IAM keys)**: scoped IAM user `enterpriseiq-vercel` (only `rds-db:connect` on dbuser `postgres`); end-to-end connect validated.
- [x] `vercel.json` region → `cle1` (co-located with us-east-2)
- [ ] **Vercel (user):** import `the-khiem7/EnterpriseIQ` → set env (see "Vercel env" block below) → deploy
- [ ] I verify `GET /api/status` green on live URL; Ingest/Ask/Graph smoke test
- [ ] Capture Team ID + storage screenshot → `docs/devpost/`
- [ ] (Optional) Upgrade to Tier A OIDC (drop static keys) for the demo

> **Unused free resources to delete later:** SG `sg-04855c07ab3341731`, subnet group
> `enterpriseiq-subnets` (express manages its own networking — these are orphaned, free).
> Teardown: `aws rds delete-db-instance --db-instance-identifier enterpriseiq-instance-1 --skip-final-snapshot` then `aws rds delete-db-cluster --db-cluster-identifier enterpriseiq --skip-final-snapshot`.

### P7 — Submission assets  `(status: not started)`
- [ ] Seed demo dataset (the VIP-refund-policy scenario)
- [ ] Architecture diagram (draw.io, AWS icons) → `docs/devpost/Additional info.md`
- [ ] AWS / Vercel storage screenshot proving Aurora usage
- [ ] `<3-min` demo video, **public** on YouTube → `docs/devpost/Project details.md`
- [ ] Fill all `docs/devpost/` fields: track, database, live link, Team ID, project name, elevator pitch, story, built-with tags
- [ ] "What we updated during submission period" note (App Status = Existing)
- [ ] (Optional bonus) publish content with `#H0Hackathon` (+0.2 each, max +0.6)

---

## Submission deliverables (DevPost) — quick status

| Requirement | Target file / field | Status |
|---|---|---|
| Track = Open Innovation | `Additional info.md` | ✅ done |
| Database = Amazon Aurora | `Additional info.md` → "Which database" | ☐ |
| Live Vercel URL | `Additional info.md` + `Project details.md` | ☐ |
| Vercel Team ID (`team_xxxxx`) | `Additional info.md` | ☐ |
| Architecture diagram | `Additional info.md` | ☐ |
| AWS DB usage screenshot | `Additional info.md` | ☐ |
| `<3-min` demo video (public YouTube) | `Project details.md` | ☐ |
| Project name + elevator pitch | `Project overview.md` | ☐ |
| Project story | `Project details.md` | ☐ |
| Built-with tags expanded | `Project details.md` | ☐ |
| "What we updated" note | `Additional info.md` | ☐ |
| Bonus content (`#H0Hackathon`) | optional | ☐ |

---

## Blockers / notes

- **[!] Live DB not yet provisioned.** All P1 code is written and typechecks, but
  cannot be verified end-to-end until either Aurora is provisioned or a local
  Postgres (with `vector` + `pgrouting`) is available. To verify locally:
  `docker run` Postgres w/ pgvector+pgrouting, set `DATABASE_URL`, `npm run migrate`.
- **Aurora SSL:** `lib/db.ts` uses `rejectUnauthorized: true`. Aurora may need the
  RDS CA bundle (`NODE_EXTRA_CA_CERTS`) or this relaxed; revisit at provision time.
- **pgrouting needs postgis** (3.x packaging). Migration 0001 now installs postgis
  first. Both Aurora-allowlisted, so production-valid — just heavier than expected.
- **Local dev DB:** `docker compose up -d` → Postgres 16 on host port **5433**
  (5432 was taken). `.env.local` has the matching `DATABASE_URL`.
- **P2 ingest needs `OPENAI_API_KEY`** in `.env.local` — (added by user during P2 verify).
- **[!] AWS CLI not authenticated** — `aws sts get-caller-identity` → NoCredentials.
  Provisioning (DEPLOY.md Option A) is gated on `aws configure` (region us-east-2).
- **AWS Console "express" create forces IAM-only auth** (not modifiable) → avoid;
  use AWS CLI (password+IAM) or full Console "Create".
- **MIGRATE_SECRET** (for `/api/admin/migrate` on Vercel) generated:
  `cff33fca05c84f1f9c51b79ee9978e4f51ac054f7f67458c883f8e243ab22d06`.

> Standing flags (see `IMPLEMENTATION_PLAN.md` → Open flags): Vietnam eligibility
> needs an eligible Representative for prizes; form hashtag typo `#H10Hackathon`
> should be `#H0Hackathon`.

---

## Session log

| Date | Phase | What was done | Next action |
|---|---|---|---|
| 2026-06-29 | — | Locked architecture (Option C: Aurora + pgvector + pgrouting). Updated plan/README. Created this tracker. | Start P0 |
| 2026-06-29 | P0/P1 | Scaffolded Next.js 16 + React 19 + Tailwind v4. Built DB layer: `lib/db.ts` (IAM + local auth), schema migration `0001_init.sql`, `scripts/migrate.mjs`, `/api/status`. Installed pg, rds-signer, openai, zod. `tsc --noEmit` passes. | Provision DB + verify, or continue to P2 ingest |
| 2026-06-29 | P2 | Ingest pipeline (`lib/{chunk,openai,triples,ingest}.ts`, `/api/ingest`, `/api/documents`) using `unpdf`. Design system + nav + hero + Documents/Status pages + Ask/Graph placeholders. Fixed stray parent-dir npm install. `npm run build` green (9 routes). | P3 Ask/Reason, or provision DB to verify |
| 2026-06-29 | verify | Local Docker DB (PG16 + pgvector + pgrouting + postgis) on port 5433. `docker/Dockerfile.postgres`, `docker-compose.yml`, `.env.local`, env-loader in `scripts/migrate.mjs`. Migrations applied; schema verified; `/api/status` all-green. | Add OPENAI_API_KEY → verify P2 ingest |
| 2026-06-29 | P2 verify | Ingested VIP-refund memo via `/api/ingest` (OpenAI live): 1 chunk embedded, 12 entities, 10 edges, clean triples. `pgr_dijkstra` over `edges_pgr` returned `v2 → v3 → Michael Tran`. Both retrieval methods validated. | Build P3 Ask/Reason |
| 2026-06-29 | P3 | Built + verified live hybrid retrieval: `lib/retrieve.ts` (pgvector seeds + `WITH RECURSIVE` subgraph), `/api/query`, Ask page with Audit Trail. Fixed missing `RECURSIVE` keyword. Demo question answered correctly with citations. Build green. | P4 Graph Explorer |
| 2026-06-29 | P4 | Graph Explorer: `/api/graph` (degree-ranked nodes/links) + `react-force-graph-2d` page (type-coloured, relationship drawer). API verified (61 nodes/68 links — a 2nd doc was ingested via UI). Build green (11 routes). | P5 Learn (feedback) |
| 2026-06-29 | P5 | `/api/feedback` + 👍/👎 on Ask page; folds into `feedback_score` ranking. Verified live (feedback row + score bump). Build green (12 routes). Full Connect→Structure→Reason→Learn loop complete. | P6 deploy (needs AWS/Vercel) |
| 2026-06-29 | P6 verify | Switched local `.env.local` to **Aurora via IAM** (Mode B). `/api/status` authMode=iam, all green. Ingested sample VIP-refund memo into Aurora (12 entities/10 edges); demo query returns correct cited multi-hop answer. Full pipeline verified on live Aurora. | Vercel deploy (user) + P7 assets |
| 2026-06-29 | P6 prep | Wrote deploy runbook `docs/project/DEPLOY.md` (Aurora provision, 3 auth tiers incl. OIDC→IAM, SSL/CA, env map, verify steps, Appendix-A code diff) + `vercel.json`. Execution pending user's AWS/Vercel accounts. | Execute P6 or start P7 assets |
| 2026-06-29 | P6 deploy | Committed+pushed all work to GitHub `main` (2 commits). Added env-var tolerance + remote SSL (`lib/db.ts`), guarded `/api/admin/migrate`, `next.config` tracing. Chose AWS CLI provisioning (DEPLOY.md Option A updated with full command plan + teardown). | User `aws configure` + decisions → run CLI provisioning |
