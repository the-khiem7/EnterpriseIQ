# Project details

*For public project page*

Information entered below will appear on your public project page.

---

## Project Story

### About the project
*Required*

## Inspiration

Y Combinator named the **"Company Brain"** — a unified reasoning layer over an organization's scattered knowledge — one of the most valuable things left to build. Enterprise knowledge lives in PDFs, Slack, email, CRMs, and unwritten tribal memory. Standard vector RAG can find text that *looks* similar, but it can't connect entities or trace a chain of decisions, so it fails on the questions that actually matter in regulated industries:

> *"How did the VIP refund policy change after Q3, and who approved the final version?"*

Answering that needs **multi-hop reasoning** across documents **and** an **audit trail** — exactly what compliance, legal, and finance teams require and what vanilla RAG can't give.

## What it does

EnterpriseIQ implements a 4-step GraphRAG pipeline — **Connect → Structure → Reason → Learn**:

1. **Connect** — Upload a PDF, Markdown, or pasted text.
2. **Structure** — An LLM extracts entity *triples* (Subject–Predicate–Object) into a knowledge graph, and embeddings into pgvector.
3. **Reason** — A question is answered by **hybrid retrieval**: pgvector finds the entry-point chunks, then a recursive SQL / pgRouting traversal expands the relevant subgraph. The LLM synthesizes a grounded answer that **cites its sources** `[#id]` and exposes an **Audit Trail** (source chunks + the exact graph path it walked).
4. **Learn** — 👍/👎 feedback adjusts retrieval ranking over time.

A **Graph Explorer** visualizes the entities and relationships, so the "Company Brain" is inspectable, not a black box.

## How we built it

- **One Amazon Aurora PostgreSQL engine** holds *relational + vector + graph* together:
  - `pgvector` for embeddings (HNSW, cosine)
  - the knowledge graph as an **edge-list** (`entities` + `edges`) traversed with **`WITH RECURSIVE`** and **`pgRouting`** (`pgr_dijkstra` for explainable approver-chains)
  - relational tables for documents, chunks, query logs, and feedback
- **Next.js (App Router) + React + Tailwind** on **Vercel** for the frontend and serverless API routes.
- **OpenAI** `gpt-4o` for triple extraction + answer synthesis, `text-embedding-3-small` for embeddings.
- **Passwordless auth**: the app connects to Aurora via **AWS IAM database authentication** (`@aws-sdk/rds-signer`) — no static DB password in the app.

## The database decision (why Aurora PostgreSQL)

The original design called for Apache AGE, but we verified against AWS's official extension allowlists that **AGE isn't available on Aurora/RDS**. Instead of bolting on a separate graph database, we proved that **one Aurora engine does it all**: `pgvector` for similarity, an edge-list + `pgRouting`/recursive CTEs for real graph traversal, and relational tables for everything else. That co-location means one source of truth, ACID consistency for auditable answers, and scale-to-zero economics — a deliberate data-model choice, not a database bolted on to check a box.

## Challenges we ran into

- **Apache AGE is not allow-listed on Aurora** — we re-architected the graph layer to native `pgRouting` + recursive SQL (and learned `pgRouting` pulls in PostGIS as a dependency).
- **Free-plan AWS** restricts Aurora creation to "express configuration," which is **IAM-only** (no password) — so we leaned into IAM token auth end-to-end, which turned out to be the stronger, passwordless design.
- Making the graph traversal bounded and cycle-safe, and surfacing the **exact** retrieval path to the user for true explainability.

## What we learned

- A "graph database" is just nodes + edges — PostgreSQL models that natively, and co-locating it with vectors beats operating two stores for this workload.
- IAM database authentication is a clean, secret-free way to connect Vercel functions to Aurora.

## What's next

- Cross-source connectors (Slack, email, Google Drive).
- Tier-A OIDC federation (drop static keys entirely).
- Temporal/versioned policies for "as-of" questions.

### Built with
*Required*

- amazon-aurora
- amazon-aurora-postgresql
- postgresql
- pgvector
- pgrouting
- postgis
- amazon-web-services
- aws-iam
- vercel
- next.js
- react
- typescript
- tailwindcss
- node.js
- openai

### "Try it out" links

- **GitHub repo:** https://github.com/the-khiem7/EnterpriseIQ
- **Live demo (Vercel):** TBD — paste the `*.vercel.app` URL after deploy

---

## Project Media

### Image gallery

> TBD — upload 3–6 screenshots (3:2, ≤5 MB each). Suggested:
> 1. **Ask** page — cited answer + Audit Trail (graph path + source chunks)
> 2. **Graph Explorer** — force-directed entity/relationship view
> 3. **Documents** — ingestion + live status
> 4. **Architecture diagram**

### Video demo link
*Required*

> TBD — < 3-min YouTube (public/unlisted). Structure: ~20s problem → ~90s live
> demo (ingest → multi-hop question → cited answer + Audit Trail → Graph Explorer)
> → ~30s the Aurora "one engine: relational + vector + graph" reasoning.
