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

EnterpriseIQ implements a **GraphRAG** architecture using Aurora PostgreSQL with `pgvector` (vector search) and `Apache AGE` (graph database) extensions, deployed on Vercel Edge Functions with a v0-generated Next.js frontend.