# Additional info

*For judges and organizers*

Unless noted, additional info is for judges and hackathon organizers and will not appear on your public project page.

---

## Upload a File

Upload a file as part of your submission - e.g., zip, pdf, word, apk, etc. To upload multiple files, put them in a zip file and upload the zip file. Limit: 35 MB.

Browse... No file selected.

---

### Submitter Type
*Required*

Team of Eligible Individuals

### Please indicate your Country of Residence.
*Required*

*Please see official rules for excluded countries.*

Vietnam

### If submitting on behalf of an organization, what is the organization name?

---

### App Status
*Required*

*Projects must be either newly created by the Entrant or, if the Entrant's Project existed prior to the Hackathon Submission Period, must have been significantly modified after the start of the Hackathon Submission Period. Entrants should explain how their Project was significantly updated during the Submission Period.*

Existing

### If your Project was Existing, please explain what you updated during the Submission Period. (We recommend explaining this in your text description, too!)

The repository began as research and planning documents only. The **entire
application** was designed, built, and deployed during the Submission Period
using the AWS Databases + Vercel integration: the GraphRAG pipeline; the Amazon
Aurora PostgreSQL data model (pgvector embeddings + a pgRouting/recursive-SQL
knowledge graph + relational tables); the Next.js frontend and serverless API on
Vercel; and passwordless AWS IAM database authentication to Aurora. No
application code existed before the Submission Period.

> Note: since all *application* code is new, you may instead select **App Status = "New"** — either is defensible; this explanation covers both.

### Testing Instructions for the Judges (if applicable)

*This question will not be shown publicly, only to Devpost and Judges.*

No login required — the app is open. To test:
1. Open the live Vercel URL.
2. **Documents** → paste any policy/memo/contract text (or upload a PDF/.md) → **Ingest** (extraction runs OpenAI per chunk; wait for "ready").
3. **Ask** → ask a multi-hop question, e.g. *"How did the VIP refund policy change after Q3, and who approved the final version?"* → read the cited answer and expand the **Audit Trail** (source chunks + the graph path traversed).
4. **Graph** → explore the entities and relationships; click a node for its relations.
5. **Status** → shows DB health (pgvector + pgRouting + tables).

Backend: **Amazon Aurora PostgreSQL** (Serverless v2, PG 17) with `pgvector` + `pgRouting`, connected from Vercel via **AWS IAM database authentication** (no static DB password).

---

### Which Track are you entering your Project into?
*Required*

*Select One. — Appears in project gallery*

Open Innovation

---

### Published Vercel/v0 Link
*Required*

*A Vercel / v0 published Project is required. A code repo is NOT a published project link. Judges will NOT request access. If a password is required, add to "Testing Instructions" field.*

https://  ← TBD: paste your live `*.vercel.app` URL after deploying

### Vercel Team ID
*Required*

*In team_xxxxx format. A Team ID is REQUIRED and available on a free Vercel account. Per our Resources FAQ: "Go to vercel.com → select your team → Settings → General → scroll to Team ID and copy it". This is required for all submissions.*

TBD: `team_xxxxx` — Vercel → your team → Settings → General → Team ID

---

### Which database did you use?
*Required*

*Regardless of track, all projects must use one of three designated Amazon Web Services databases (Amazon Aurora, Amazon Aurora DSQL, or Amazon DynamoDB) as the primary back end and deploy their front end on Vercel or v0.app. — Appears in project gallery*

**Amazon Aurora** (Aurora PostgreSQL, Serverless v2)

---

### Architecture diagram (required)

*Show how the project application connects to back-end components. See Resources tab for tips.*

*Allowed: pdf, ppt, pptx, png, jpg, jpeg.*
*Max 35MB per file.*

> TBD — attach the architecture diagram (draw.io / PNG). It should show: Browser →
> Vercel (Next.js UI + serverless API) → **OIDC/IAM auth** → **Amazon Aurora
> PostgreSQL** (relational + pgvector + pgRouting/recursive-SQL graph), with
> OpenAI (gpt-4o + text-embedding-3-small) as an external call. See README.md
> Architecture section for the reference layout.

**File can't be blank**

---

### Upload a screenshot proving your aws database usage (required)

*(e.g. Vercel Storage Configuration, AWS Console showing your Aurora/DynamoDB resource, or similar)*

*Allowed: pdf, png, jpg, jpeg.*
*Max 35MB per file.*

> TBD — attach a screenshot proving Aurora usage. Best options: the **AWS RDS
> console** showing the `enterpriseiq` Aurora PostgreSQL cluster (Available), or
> the **Vercel → Storage** view. (Endpoint: `enterpriseiq.cluster-ctqkaawasuw5.us-east-2.rds.amazonaws.com`.)

**File can't be blank**

---

### URL(s) to your OPTIONAL content for Bonus Points

*You must include language that says you created the piece of content for the purposes of entering this hackathon. When sharing on social media, use the hashtag #H0Hackathon.*

> Optional (+0.2 each, max +0.6): a blog/video on how EnterpriseIQ was built on
> Aurora PostgreSQL + Vercel. Must be public, state it was created for this
> hackathon, and use **#H0Hackathon**. (The form's `#H10Hackathon` is a typo.)