# EnterpriseIQ — Implementation Roadmap & Progress Tracker

> **Single source of truth for build progress.** This file is designed to be
> resumed from cold — anyone (human or agent) can read *only* this file plus
> [`docs/project/IMPLEMENTATION_PLAN.md`](docs/project/IMPLEMENTATION_PLAN.md)
> and continue without conversation history.
>
> **Design spec lives in** `IMPLEMENTATION_PLAN.md` (architecture, data model,
> decision log). **Live status lives here.**

**Last updated:** 2026-06-29
**Current phase:** P2 — ingest pipeline + Documents UI code-complete; build green; live-DB verification pending
**Next action:** P3 (Ask/Reason) — or provision DB and verify P1/P2 end-to-end first

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
- [ ] Enable extensions: `CREATE EXTENSION vector;` `CREATE EXTENSION pgrouting;` — verify versions succeed *(in migration 0001; runs at provision time)*
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
- [ ] **Verify live:** `npm run migrate` against a real DB, then `GET /api/status` returns `hasVector`/`hasPgrouting` true

### P2 — Ingest: Connect + Structure  `(status: code complete; live verification pending)`
- [x] `/api/ingest` — PDF (`unpdf`) / markdown / pasted text → `app/api/ingest/route.ts`
- [x] Chunking (~600 tok, ~80 overlap) → `lib/chunk.ts`
- [x] OpenAI triple extraction (`gpt-4o`, `zod`-validated) → `lib/openai.ts`, `lib/triples.ts`
- [x] OpenAI embeddings (`text-embedding-3-small`) → `chunks.embedding` (pgvector literal)
- [x] Upsert `entities` (`ON CONFLICT`) + insert `edges` → `lib/ingest.ts`
- [x] **Documents page** — upload (paste/file), list, polling status → `app/documents/page.tsx`
- [x] `/api/documents` list endpoint
- [ ] **Verify live:** ingest a doc against a real DB → chunks + entities + edges populated

**Bonus this pass (design foundation):** "Evidence/Blueprint" design system in
`globals.css` (teal signal + amber provenance, Space Grotesk/Inter/JetBrains Mono);
app shell + nav (`app/components/app-nav.tsx`); thesis hero (`app/page.tsx`);
Status page (`app/status/page.tsx`); Ask/Graph placeholders. `npm run build` green.

### P3 — Query: Reason  `(status: not started)`
- [ ] `/api/query` — embed question → pgvector ANN → seed chunks + entities
- [ ] `WITH RECURSIVE` k-hop expansion (depth cap + visited-set); `pgr_dijkstra` path for "who/what chain" questions
- [ ] Assemble context → `gpt-4o` synthesis with chunk + path **citations**
- [ ] Write `query_logs`
- [ ] **Ask page** + expandable **Audit Trail** panel (sources + paths + SQL ran)

### P4 — Graph Explorer  `(status: not started)`
- [ ] `/api/graph` — read `entities` / `edges`
- [ ] `react-force-graph` viz; click node → connected docs

### P5 — Learn: feedback  `(status: not started)`
- [ ] `/api/feedback` — 👍/👎 + optional note → `feedback`
- [ ] Adjust `chunks.feedback_score`; factor into ranking (`distance − w·feedback_score`)

### P6 — Harden & deploy  `(status: not started)`
- [ ] IAM auth working in production
- [ ] Error / empty states across pages
- [ ] Cold-start warm path for the live demo
- [ ] Env/config review; no static secrets in code

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
