# Agents — DevPost Submission Context

## Status: INCOMPLETE — Pending Project Implementation

The DevPost hackathon submission for **EnterpriseIQ** is currently in progress. The four submission page templates have been created in `docs/devpost/` as markdown mirrors of the DevPost form, but most fields remain placeholder (`TBD`) or contain only structural scaffolding.

**Do NOT submit to DevPost until all fields below are populated with real content.**

---

## Submission Files

| File | Purpose | Status |
|------|---------|--------|
| `docs/devpost/Project overview.md` | Project name, elevator pitch, thumbnail | ❌ All fields TBD |
| `docs/devpost/Project details.md` | Project story, built-with tags, media, video link | ⚠️ Partial — tags filled, story/media TBD |
| `docs/devpost/Additional info.md` | Submitter info, track, Vercel links, DB selection, diagrams | ⚠️ Partial — some fields filled, files missing |
| `docs/devpost/Submit project.md` | Pre-submission checklist and terms | ✅ Reference only |

---

## Fields Requiring Population

Once the project implementation is complete, the following fields **must** be filled in each file before transferring content to DevPost.

### `Project overview.md`

- **Project name** — Replace `TBD` with the final project name
- **Elevator pitch** — Replace `TBD` with a concise tagline (max 254 characters)
- **Thumbnail** — Replace placeholder with the actual thumbnail image reference

### `Project details.md`

- **About the project** — Write the full project story covering:
  - Inspiration
  - What was learned
  - How it was built
  - Challenges faced
- **Built with** — Verify tag list matches actual tech stack (currently: `amazon-web-services`, `vercel`)
- **"Try it out" links** — Add live demo URL, GitHub repo, and any other relevant links
- **Image gallery** — Upload project screenshots/images
- **Video demo link** — Replace placeholder YouTube link with actual demo video

### `Additional info.md`

- **Testing Instructions for the Judges** — Add login credentials or testing notes (if applicable)
- **Published Vercel/v0 Link** — Replace `https://` with the actual deployed URL
- **Vercel Team ID** — Add the `team_XXXXX` identifier
- **Which database did you use?** — Select the actual AWS database(s) used (Aurora, Aurora DSQL, or DynamoDB)
- **Architecture diagram** — Upload the architecture diagram file
- **AWS database usage screenshot** — Upload proof of database usage
- **URL(s) to optional bonus content** — Add any blog posts, articles, or social media content (use `#H10Hackathon`)

---

## Rule: Post-Implementation Submission Workflow

When the project implementation is **complete** (all code written, tested, deployed, and verified):

1. **Review `docs/devpost/` files** — Open each file and confirm every `TBD` / placeholder is replaced with real content
2. **Gather assets** — Collect all required files:
   - Thumbnail image (JPG/PNG/GIF, 3:2 ratio, ≤5MB)
   - Architecture diagram (PDF/PPT/PNG/JPG, ≤35MB)
   - AWS database usage screenshot (PDF/PNG/JPG, ≤35MB)
   - Demo video (uploaded to YouTube, set to public)
3. **Copy content to DevPost** — Transfer each markdown section into the corresponding DevPost form fields
4. **Run the pre-submission checklist** — Follow `docs/devpost/Submit project.md` to verify every requirement is met
5. **Accept terms and submit** — Check the Terms & conditions box and click Submit

**Deadline reference**: June 29, 2026 at 5:00 PM PT (as shown in submission form).
