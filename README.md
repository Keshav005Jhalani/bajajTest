# BFHL — Node Hierarchy Visualizer

SRM Full Stack Engineering Challenge — Round 1

## Stack

- **Framework**: Next.js 14 (React + Node.js API routes)
- **Hosting**: Vercel (recommended)

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

API available at http://localhost:3000/api/bfhl

## Before Deploying — Fill in your details

Open `pages/api/bfhl.js` and update these three lines:

```js
const USER_ID = "fullname_ddmmyyyy";       // e.g. "johndoe_17091999"
const EMAIL_ID = "your.email@college.edu";
const COLLEGE_ROLL_NUMBER = "XXXXXXXXXXXX";
```

## Deploy to Vercel (Recommended)

1. Push this repo to GitHub (public repo)
2. Go to https://vercel.com → New Project → Import your repo
3. Click Deploy — no config needed, Vercel auto-detects Next.js
4. Your API will be live at: `https://your-app.vercel.app/api/bfhl`
5. Your frontend will be live at: `https://your-app.vercel.app`

## API Reference

**POST** `/api/bfhl`

Request:
```json
{ "data": ["A->B", "A->C", "B->D"] }
```

Response:
```json
{
  "user_id": "...",
  "email_id": "...",
  "college_roll_number": "...",
  "hierarchies": [...],
  "invalid_entries": [...],
  "duplicate_edges": [...],
  "summary": { "total_trees": 1, "total_cycles": 0, "largest_tree_root": "A" }
}
```
