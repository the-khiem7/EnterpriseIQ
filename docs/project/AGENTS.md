# Project Decision Record

## Chosen Solution: EnterpriseIQ

We have chosen **EnterpriseIQ** — an AI-powered Enterprise Knowledge Graph Platform (GraphRAG).

### Context

- **Hackathon**: H0: Hack the Zero Stack with Vercel v0 and AWS Databases
- **Track**: Track 4 — Open Innovation
- **Submitted**: June 29, 2026

### Problem

Enterprise knowledge is fragmented across emails, Slack, PDFs, CRM, and tribal knowledge. Standard RAG fails at multi-hop reasoning and structured relationship queries.

### Solution

EnterpriseIQ implements a **GraphRAG** architecture on a single Amazon Aurora PostgreSQL engine using `pgvector` (vector search) and `pgrouting` + recursive SQL (knowledge graph over an entities/edges model), deployed on Vercel with a Next.js frontend.

> **Decision update (graph layer):** the original design named `Apache AGE`, but
> AGE is **not** on the AWS-managed Postgres extension allowlist (Aurora or RDS),
> so `CREATE EXTENSION age;` is impossible on Aurora. We deliver the knowledge
> graph natively with `pgrouting` + `WITH RECURSIVE` over an edge-list — same
> multi-hop capability, single engine, stronger consistency for auditable
> answers. See `IMPLEMENTATION_PLAN.md` → Decision log.