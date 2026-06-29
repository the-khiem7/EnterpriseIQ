
---
title: "H0: Hack the Zero Stack — Build Session Q&A"
source: "https://devpost.notion.site/H0-Hack-the-Zero-Stack-Build-Session-Q-A-387bf3c6a91d80ceb4bafb6d762783ae"
author:
published:
created: 2026-06-29
description: "A collaborative AI workspace, built on your company context. Build and orchestrate agents right alongside your team's projects, meetings, and connected apps."
tags:
  - "clippings"
---
Presented by Ronak Shah and Abhi Anand Submission deadline: June 29, 2026 at 8:00 PM EDT → [Submit on Devpost](https://h01.devpost.com/) Last updated June 22, 2026 — updated as new questions come in

> Still have a question? Post it in the [H0 Discussions tab](https://h01.devpost.com/) or ask in the [Devpost Discord](https://discord.gg/devpost). The AWS and Vercel teams are monitoring both.

### Picking Your Track

Can my project qualify for multiple tracks? One app, one track. If your project spans multiple tracks, choose the one that best reflects its primary intent. An app that's B2C but could scale globally — ask yourself: is the main focus the consumer experience, or the scale architecture? Go with whichever is primary.

If you have time, you can build separate applications and submit each to a different track.

Does my project need to already make revenue to qualify for the B2C or B2B tracks? No. "Monetizable" means you've thought about the commercial model — not that you're already generating revenue. Show your thinking, not a profit and loss statement.

What if none of the three main tracks fit what I'm building? There's a fourth open track — build any application in any industry. You still need to use Vercel and one of the three AWS databases, but you're not constrained to a specific use case.

### Stack Requirements

What databases are part of the integration? Three: Amazon Aurora PostgreSQL, Aurora DSQL, and Amazon DynamoDB. Your project must use at least one through the Vercel integration.

Do I have to use Next.js for my backend API? No. The session demo used FastAPI (Python) — that's fully valid. Use whatever framework you're comfortable with. Vercel can deploy Python backends alongside your frontend.

Can I use other AWS services like S3 or Bedrock on top of the required databases? Yes. Your Vercel app can connect to multiple AWS accounts and services. The $100 in AWS credits apply to most AWS services, not just databases. Just make sure one of the three integrated databases is part of your stack.

Does my app need to be deployed on Vercel, or can I deploy on AWS directly? Vercel deployment is the expected path. The Vercel ↔ AWS database integration is what the hackathon is built around.

I ran out of V0 credits. Can I keep building? Yes — switch to Claude Code, Codex, Cursor, or your local setup. Mixing tools is fine and common. What matters is that the final project deploys on Vercel using one of the three AWS databases.

I connected via OIDC federation and provisioned my database through AWS CDK — will it show up in Vercel storage? Not automatically. Two options: (1) apply the same tags the Vercel integration uses to your CDK-provisioned resource, or (2) walk through the connection explicitly in your demo video so reviewers can see the architecture clearly.

Does it matter if I provisioned the database through the Vercel UI vs. the AWS console directly? Vercel UI or CLI is preferred — resources get tagged in a way that makes verification easy for judges. If you provisioned through the console, you can still qualify — just make the connection flow clear in your demo video.

Is VPC peering required? No. Not expected, not a judging criteria. Available on Vercel Pro/Enterprise if you want it, but don't spend time on it for this hackathon.

### AWS Account & Credits

I set up an AWS account through the Vercel integration but can't access S3 or other services. Why? The account auto-created by the integration is limited-scope — it only allows the integrated database services (plus OpenSearch). To use other AWS services, connect your own existing AWS account to the Vercel integration separately. You can run both in parallel.

How long does it take to receive the $100 AWS credits? About 3 business days. Friday submissions arrive Monday or Tuesday.

> Important: Write your own explanation on the credits form. Vague or AI-generated descriptions see significantly higher denial rates. It doesn't need to be long — it needs to be specific and human-written about what you're building and why you need the credits.

What can the $100 AWS credits be used for? Most AWS services — not just the databases. Use them for whatever your project needs.

### Submitting Your Project

What does my submission need to include?

At minimum:

Architecture diagram (example on the hackathon website)

3-minute demo video — unlisted or public on YouTube

Repository link

Devpost submission with all links filled in before the deadline

Check the [hackathon website](https://h01.devpost.com/) for the full requirements — that's the authoritative source.

> Once the deadline passes, you cannot add or change links on Devpost. Make sure your YouTube link and repo link are there before time runs out.

Can I keep my GitHub repo private? The rules don't explicitly require a public repo — if there's no rule against it, assume private is fine. Your submission still needs all required elements. (Confirmed answer coming — this doc will be updated.)

What screenshots do I need to prove I'm using an AWS database? Go to your Vercel dashboard → Storage. Screenshot the database shown there. You can also click through to the AWS console from Vercel to show the database is live and connected.

Can I update my project after submitting? Judges evaluate your submission at the deadline — the demo recording captures the app's state at that point. Don't update the repo after submitting. If you want to keep building, fork it and continue in the fork. Updating the original repo after the deadline isn't fair to other participants.

What should my 3-minute demo video cover? Structure it around the four judging criteria:

Technical implementation — show your architecture, how Vercel and AWS are connected

Design — show the UI working

Real-world impact — explain the problem and who it's for

Originality — call out what's creative or technically interesting about your approach

Does my YouTube video need to be public? Public or unlisted — either works. Private videos cannot be reviewed. Double-check this before the deadline.

### Judging & Prizes

How is judging weighted across the four criteria? Technical implementation, design, impact, and originality are roughly equally weighted — but not exactly equal. (Exact breakdown coming — this doc will be updated.)

What are judges actually looking for in technical implementation? Your architecture diagram and the reasoning behind your choices. You don't need a million-row database — you need to show that your architecture makes sense for your use case and the scale you're designing for.

What database choice would impress experienced engineers? Ronak's answer: it's not which database you chose — it's why. Articulating your reasoning (DynamoDB for NoSQL at scale, Aurora Postgres for relational workloads, DSQL for distributed SQL globally) shows architectural maturity. That's what stands out.

Are there prizes beyond the four track winners? Yes — four additional category awards:

| Category                      | Prize                            |
| ----------------------------- | -------------------------------- |
| Best Technical Implementation | $2,000 cash + $2,000 AWS credits |
| Best Design                   | $2,000 cash + $2,000 AWS credits |
| Most Impactful                | $2,000 cash + $2,000 AWS credits |
| Most Original                 | $2,000 cash + $2,000 AWS credits |

You can win a category award even if you don't win your track.

How do the bonus content points work? Publish original content (blog post, YouTube video, etc.) on any public platform and earn +0.2 points per piece, up to +0.6 points for 3 pieces. On a 5-point scale, that's significant. Eligible platforms include YouTube, personal blogs, and the AWS Builder Center.

> Question not answered here? Post it in the [H0 Discussions tab](https://h01.devpost.com/) or drop it in the [Devpost Discord](https://discord.gg/devpost).

