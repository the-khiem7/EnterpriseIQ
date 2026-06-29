# EnterpriseIQ — Deployment Runbook (P6)

> Goal: ship EnterpriseIQ to **Vercel** backed by **Amazon Aurora PostgreSQL**,
> with **passwordless OIDC → IAM** auth (the technical-implementation showpiece).
> Work top-to-bottom. Boxes are a checklist; mirror status into `ROADMAP.md` P6.
>
> Three auth tiers are documented — do **Tier A** for the best judging story;
> Tiers B/C are faster fallbacks if you get stuck.

---

## 0. Prerequisites

- [ ] AWS account (the Vercel-Marketplace-provisioned one is fine, but it is
      limited-scope — see note in Step 1).
- [ ] Vercel account + the project pushed to a Git repo (GitHub/GitLab).
- [ ] Local `psql`/Docker still works (used to run migrations against Aurora).
- [ ] An `OPENAI_API_KEY`.

---

## 1. Provision Aurora PostgreSQL

**Preferred — Vercel Marketplace** (auto-tags resources so the submission
screenshot is trivial):
- [ ] Vercel dashboard → **Storage** → **Create Database** → AWS → **Aurora PostgreSQL**.
- [ ] Choose **Serverless v2**, min ACU `0.5` (enable **auto-pause / scale-to-zero**), engine **PostgreSQL 16**.
- [ ] Note the cluster **endpoint**, **port** (5432), **db name**, master user/password.

**Alternative — AWS Console**: RDS → Create database → Aurora (PostgreSQL-Compatible)
→ Serverless v2 → PG16. Then connect it to Vercel via the Marketplace integration
or set env vars manually.

> The Marketplace-auto-created AWS account only allows the integrated DB services.
> For OIDC/IAM role setup (Tier A) you need IAM access — use your **own** AWS
> account connected to Vercel, or do Tier C first and upgrade to A later.

---

## 2. Enable extensions + run migrations

Aurora allowlists all three required extensions. Point the migration runner at
Aurora and apply the schema (creates `vector`, `postgis`, `pgrouting` + tables).

- [ ] Temporarily set a direct connection string locally (master creds), e.g.:
      ```
      # .env.local  (DO NOT commit; this is just to run the migration)
      DATABASE_URL=postgres://<master_user>:<pw>@<cluster-endpoint>:5432/enterpriseiq?sslmode=require
      ```
- [ ] Run: `npm run migrate`
- [ ] Verify in psql: `\dx` shows vector/postgis/pgrouting; 6 core tables present.

> If `sslmode=require` fails locally on cert verification, see **Step 5 (SSL)**.

---

## 3. Vercel project + environment variables

- [ ] Import the Git repo into Vercel (Framework: **Next.js**, auto-detected).
- [ ] **Settings → Environment Variables** (Production + Preview):
      | Var | Value |
      |---|---|
      | `OPENAI_API_KEY` | your key |
      | `OPENAI_MODEL` | `gpt-4o` (optional override) |
      | one of the auth tiers below | — |
- [ ] **Settings → General → Team ID** → copy `team_xxxxx` into
      `docs/devpost/Additional info.md`.

---

## 4. Database auth — pick a tier

### Tier A — OIDC → IAM (passwordless, recommended) ⭐
No static DB password in the app; Vercel mints an OIDC token, AWS STS exchanges
it for short-lived credentials, and `rds-signer` mints a 15-min DB auth token.

1. **Aurora**: enable **IAM database authentication** on the cluster (Modify → enable).
2. **Create an IAM-auth DB user** (run once, as master):
   ```sql
   CREATE USER enterpriseiq_app;
   GRANT rds_iam TO enterpriseiq_app;
   GRANT ALL ON ALL TABLES IN SCHEMA public TO enterpriseiq_app;
   GRANT USAGE ON SCHEMA public TO enterpriseiq_app;
   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO enterpriseiq_app;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO enterpriseiq_app;
   ```
3. **IAM policy** allowing DB connect (attach to the role in step 5):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": "rds-db:connect",
       "Resource": "arn:aws:rds-db:<region>:<account-id>:dbuser:<cluster-resource-id>/enterpriseiq_app"
     }]
   }
   ```
4. **Vercel OIDC provider in AWS IAM**:
   - IAM → Identity providers → Add provider → **OpenID Connect**.
   - Provider URL: `https://oidc.vercel.com/<your-vercel-team-slug>`  (audience: `https://vercel.com/<team-slug>`).
   - Create an **IAM role** with a web-identity trust policy for that provider,
     scoped to your project's subject (`owner:<team>:project:<project>:environment:production`),
     and attach the policy from step 3.
5. **Vercel env** (enable OIDC under Settings → Security → "Secure backend access / OIDC"):
   ```
   USE_IAM_AUTH=true
   AWS_REGION=<region>
   PGHOST=<cluster-endpoint>
   PGPORT=5432
   PGDATABASE=enterpriseiq
   PGUSER=enterpriseiq_app
   AWS_ROLE_ARN=arn:aws:iam::<account-id>:role/<vercel-oidc-role>
   ```
6. **Code change** — wire the OIDC credentials provider into the Signer
   (see **Appendix A**). Requires `npm i @vercel/functions`.

### Tier B — Static IAM keys + rds-signer (simpler, no OIDC)
Do steps 1–3 of Tier A, skip 4–6. Create an IAM user with the `rds-db:connect`
policy, and set in Vercel:
```
USE_IAM_AUTH=true
AWS_REGION=<region>
AWS_ACCESS_KEY_ID=<...>
AWS_SECRET_ACCESS_KEY=<...>
PGHOST=<endpoint>  PGPORT=5432  PGDATABASE=enterpriseiq  PGUSER=enterpriseiq_app
```
`lib/db.ts` already works as-is (default credential chain picks up the keys).

### Tier C — Plain password connection string (quickest)
Just set in Vercel:
```
DATABASE_URL=postgres://<master_user>:<pw>@<endpoint>:5432/enterpriseiq?sslmode=require
```
Works immediately; loses the passwordless story. Good for a first smoke-test,
upgrade to Tier A before recording the demo.

---

## 5. SSL / CA (Aurora requires TLS)

`lib/db.ts` (Tier A/B) sets `ssl: { rejectUnauthorized: true }`. Node doesn't
trust the RDS CA by default, so do **one** of:

- **Recommended:** bundle the Amazon RDS global CA and point Node at it.
  Download `https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem`
  into the repo (e.g. `certs/rds-global-bundle.pem`) and either set Vercel env
  `NODE_EXTRA_CA_CERTS=certs/rds-global-bundle.pem`, or load it explicitly in
  `lib/db.ts` (**Appendix A** shows the `ssl.ca` form).
- **Quick fallback:** set `ssl: { rejectUnauthorized: false }` (encrypted but
  unverified). Acceptable for the demo, not ideal.

---

## 6. Deploy + verify

- [ ] Push to the connected branch (or `vercel --prod`) → wait for build.
- [ ] `GET https://<app>.vercel.app/api/status` → `ok:true, hasVector, hasPgrouting, coreTables:6`.
- [ ] Ingest a doc via the live **Documents** page; confirm `ready` + edges.
- [ ] Ask the demo question on **Ask**; confirm cited answer + Audit Trail.
- [ ] Open **Graph**; confirm the force-graph renders.

---

## 7. Capture submission artifacts (feeds P7)

- [ ] **Storage screenshot**: Vercel → Storage → the Aurora resource (proves DB usage).
- [ ] **Live URL** + **Team ID** → `docs/devpost/Additional info.md`.
- [ ] Keep the cluster reachable for judges (no IP allowlist lockout; scale-to-zero is fine).

---

## Appendix A — production `lib/db.ts` tweaks (apply at deploy time)

Add the RDS CA and (Tier A) the Vercel OIDC credentials provider:

```ts
// top of lib/db.ts
import { awsCredentialsProvider } from "@vercel/functions/oidc"; // Tier A only
import { readFileSync } from "node:fs";

const rdsCa = process.env.RDS_CA_PATH
  ? readFileSync(process.env.RDS_CA_PATH, "utf8")
  : undefined;

// in baseConfig(), Mode B ssl:
ssl: rdsCa ? { ca: rdsCa } : { rejectUnauthorized: false },

// in the Signer construction (Tier A), pass credentials:
const signer = new Signer({
  hostname: host, port, username: user,
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: process.env.AWS_ROLE_ARN
    ? awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN })
    : undefined, // falls back to default chain (Tier B)
});
```

> Ask Claude to apply this diff when you're ready — it's intentionally left out
> of the committed code so local dev (Tier C / Docker) stays dependency-free.
