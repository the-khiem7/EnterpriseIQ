
---
title: "H0: Hack the Zero Stack with Vercel v0 and AWS Databases"
source: "https://h01.devpost.com/resources"
author:
published:
created: 2026-06-29
description: "Front-end in minutes. Back-end designed for scale."
tags:
  - "clippings"
---
Earlier this year, AWS and Vercel announced a collaboration bringing AWS Databases to v0. Get the full story on the [Vercel blog](https://vercel.com/blog/aws-databases-are-now-live-on-the-vercel-marketplace-and-v0) and the [AWS blog](https://aws.amazon.com/blogs/database/ai-native-full-stack-web-apps-with-vercel-and-aws-databases/).

#### Getting Started

Everything you need to go from zero to a running full-stack app on the AWS + Vercel stack.

1. [Sign up for v0](https://vercel.com/signup)
2. [Request credits](https://forms.gle/ozhbhvaXAxHxu3kMA) for AWS and v0 by June 26th at 12pm PT.
3. [Prompt v0 to build with AWS Databases](https://v0.app/?pi=aws)
4. Attend/Watch the Devpost Build Session: June 22nd at 10am PT / 1pm ET
   - We are hosting a live session to answer your biggest FAQs and share insider tips that will benefit your hackathon builds and beyond! The session will be recorded and seats are limited. [Sign up.](https://us02web.zoom.us/webinar/register/WN_Ga39jBx_SEKkrKWEJj97vw#/registration)

##### AWS

**Aurora** **PostgreSQL**

- [What is Amazon Aurora?](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html)
- [Getting started with Aurora](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_GettingStartedAurora.html)
- [Connect Next.js to Aurora — Vercel KB guide](https://vercel.com/kb/guide/connect-next-js-to-amazon-aurora-postgresql-using-vercel-marketplace)
- [Aurora on Vercel Marketplace](https://vercel.com/marketplace/aws/aws-apg)
- [Aurora FAQs](https://aws.amazon.com/rds/aurora/faqs/)

**DynamoDB**

- [What is DynamoDB?](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)
- [Getting started with DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStartedDynamoDB.html)
- [DynamoDB on Vercel Marketplace](https://vercel.com/marketplace/aws/aws-dynamodb)
- [DynamoDB resources page](https://aws.amazon.com/dynamodb/resources/)

**Aurora DSQL**

- [What is Aurora DSQL?](https://docs.aws.amazon.com/aurora-dsql/latest/userguide/what-is-aurora-dsql.html)
- [Getting started with Aurora DSQL](https://docs.aws.amazon.com/aurora-dsql/latest/userguide/getting-started.html)
- [Aurora DSQL on Vercel Marketplace](https://vercel.com/marketplace/aws/aws-dsql)
- [Aurora DSQL Starter Kit (AWS Labs)](https://awslabs.github.io/aurora-dsql-starter-kit/guides/getting-started/quickstart.html)
- [Vercel&#39;s DSQL demo on GitHub](https://github.com/vercel/aws-dsql-movies-demo)
- [Aurora DSQL resources page](https://aws.amazon.com/rds/aurora/dsql/resources/)

##### Vercel

AI-powered frontend generation. Describe what you want, v0 generates production-ready React/Next.js code with Tailwind CSS. Deploy to Vercel in one click.

- [What is v0?](https://vercel.com/docs/v0)
- [v0 Quickstart](https://v0.app/docs/quickstart)
- [v0 FAQs](https://v0.app/docs/faqs)
- [v0 homepage](https://v0.app/)
- [Next.js on Vercel](https://vercel.com/templates/next.js/next-js-vercel-app-with-aurora-postgresql)
- [AWS Databases on Vercel marketplace](https://vercel.com/marketplace/aws)
- [Vercel Documentation](https://vercel.com/docs)

#### FAQs

##### Getting Started

**Q: Do I need to use v0 to build my frontend?**

You must deploy on Vercel, but v0 is one of several ways to do that. You can also build your frontend manually (Next.js, Nuxt, SvelteKit, Astro, Remix, etc.) and deploy via the Vercel CLI or GitHub integration. v0 is recommended for speed, not required.

**Q: Can I start with an existing project?**

Yes. If it existed before May 27, 2026, it must have been materially updated to use AWS Databases and the Vercel integration after the submission period begins. Judges may request evidence of work completed during the hackathon.

**Q: Can I use AI tools to help build my project?**

Yes, you may usev0, Copilot, Cursor, or AI coding assistants/IDEs. Judges evaluate the quality of your submission based on the defined criteria, not whether AI generated your UI components. Submissions with no meaningful engineering decisions will score poorly on Technical Implementation.

##### The Databases

**Q: How do I connect my AWS Databases to my Vercel app?**

Simply prompt [v0 to build with an AWS database](https://v0.app/?pi=aws). You may also connect to AWS Databases from the Vercel marketplace. Check out the [Vercel blog](https://vercel.com/blog/aws-databases-are-now-live-on-the-vercel-marketplace-and-v0) with instructions.

**Q: Can my project use more than one AWS Database?**

Yes. Judges evaluate your application architecture including the choice of database for your application.

##### Vercel and v0

**Q: Does using v0 affect how my project is judged?**

v0 is an officially encouraged part of the stack. Judges evaluate your database integration, architecture, and product quality. The Technical Implementation criterion rewards genuine engineering decisions — a submission that is purely “I prompted v0 and submitted” without thoughtful database work will score poorly.

**Q: How do I deploy from v0 to a live Vercel URL?**

In v0, click Deploy. This creates a Vercel project linked to your account and gives you a \*.vercel.app URL. Add your AWS credentials as environment variables under Settings → Environment Variables in your Vercel project dashboard.

**Q: How do I keep my AWS credentials secure in a Vercel deployment?**

Never commit credentials to your repository (which must be public for submission review). Use Vercel Environment Variables for AWS\_ACCESS\_KEY\_ID, AWS\_SECRET\_ACCESS\_KEY, and AWS\_REGION. The Vercel Marketplace OIDC integration is the most secure option — it uses IAM roles with no stored keys. See the Starter Kits for working examples.

**Q: How do I find my Team ID?**

Go to vercel.com → select your team → Settings → General → scroll to "Team ID" and copy it or

[This helpful article](https://vercel.com/docs/accounts#find-your-team-id) will show you where to find your team ID in Vercel.

##### Credits and Costs

**Q: How do I get my free AWS and v0 credits?**

Complete the [credit request form](https://forms.gle/ozhbhvaXAxHxu3kMA) linked on the hackathon page after registering. You’ll receive $100 in AWS promotional credits and $30 in v0 credits. Credits are distributed while supplies last.

**Q: What if I run out of credits before the deadline?**

Credits are sized to cover typical development usage. Additional costs are your responsibility. You are not required to spend beyond the provided credits to build a competitive submission. We recommend you monitor your AWS spend in the AWS Cost Explorer.

**Q: When do the credits expire?**

AWS promotional credits expire July 31st, 2026. v0 credits expire July 13, 2026.

##### Submissions and rules

**Q: Can I submit to more than one track?**

Each project can only be submitted to one Track. However, if you find you have enough time to build more than one project, you can submit to another, but each submission must be a unique and substantially different project.

**Q: What should an architecture diagram look like?**

It should be clear and show your front end, backend, APIs/connections, and optionally, any components you plan to add later to ensure your application is ‘ [well architected](https://aws.amazon.com/architecture/well-architected/) ’ for operational excellence, security, performance, reliability, cost optimization, etc.


**Tips:**

- Label every box with both what it is (the component type, like "PostgreSQL" or "Lambda function") and what it does.
- Show direction of calls with arrows — bidirectional only when it's actually bidirectional.
- Group cloud-provider services if they're using one (e.g. a dashed box around "AWS" containing the components hosted there). The AWS Well-Architected page and the AWS Architecture Icons set are great references — many participants use those official icons.
- Tools that work well: draw.io / diagrams.net (free, has AWS icon libraries built in), Excalidraw, Lucidchart, or Figma. Any of these can export to PNG/JPG/SVG.

**Q: How do I prove I used one of the three required databases?**

Screenshot the Storage configuration page from within v0 or Vercel

**Q: How do I get Bonus Points?**

Publish a piece of content (blog, podcast, video): Cover how you built your project using one of the specified AWS Databases and Vercel. You can submit more than one piece of content. The content must be published publicly (e.g., on [builder.aws.com](https://builder.aws.com/connect/space/71f2a761-009f-3283-846c-9a6f86fb4763/h0-hackathon), LinkedIn, medium.com, dev.to, YouTube, etc.) and not unlisted. You must include language that says you created the piece of content for the purposes of entering this hackathon. When sharing on social media, use the hashtag **#H0Hackathon.**

**Q:** **Can I submit a mobile app?**

H0 is built around Vercel, and the rules require that all projects "deploy their front end on Vercel or v0.app." Since Vercel is a web deployment platform, your project needs to be web-accessible — not a native iOS or Android app distributed through an app store.

That said, you can absolutely build something that *feels* like a mobile app. A progressive web app (PWA) or a fully responsive web app deployed on Vercel counts, and it'll still need to meet the core stack and submission requirements: one of the three AWS databases (Aurora, Aurora DSQL, or DynamoDB) on the back end, deployed front end on Vercel, and a Vercel Team ID you can include in your submission.

The submission also requires a Storage Configuration screenshot from your Vercel project and a link to your published Vercel project — so however you build it, there needs to be a real Vercel deployment at the end.