# Snap Note · AI Memo Workspace

> Capture thoughts by voice or text, let AI polish them, and keep everything searchable and shareable.

---

## Highlights

- **Voice & Text Capture** – Record straight from the browser or paste/upload notes. Auto language detection (EN/KR/JP/ES/FR/DE) keeps flows seamless.  
- **AI Refinement Pairing** – Groq-powered refinement mirrors polished copy alongside the original draft so you never lose context.  
- **Smart Tagging & Contexts** – Maintain structured categories with localized labels, quick filters, and inline tag editing.  
- **Auto Save & Version Safety** – Result screen persists memos as soon as requirements are met and falls back gracefully if AI is unavailable.  
- **Bulk Operations at Scale** – Chunked Supabase updates (50 memos per batch) with live progress feedback prevent timeouts during cleanup.  
- **Notion Export Tools** – One-click sharing or bulk sync to your Notion database, plus a connectivity tester to verify credentials.  
- **Deploy-Friendly** – Vite + React SPA for the frontend, Vercel serverless functions for AI/Notion/Supabase glue code, and migrations managed via Supabase CLI.

---

## Architecture Overview

```
Browser (React PWA)
 ├─ Voice recorder & file uploader
 ├─ Result editor (AI refined + original text)
 ├─ Memo list (filters, bulk ops, sharing)
 │
 │  React Query ↔ Supabase JS client
 │
 └─ Zustand store for language selection & UI state

Serverless (Vercel Functions)
 ├─ /api/refine        → LangChain + Groq to clean/refine text
 ├─ /api/memo          → CRUD passthrough to Supabase (legacy REST surface)
 ├─ /api/notion-test   → Validate Notion API key/database
 └─ /api/notion-sync   → Push curated memo content to Notion pages

Database (Supabase / Postgres)
 ├─ memos table with refined/original text, tags, contexts, insights
 ├─ Triggers for search_vector + updated_at
 └─ RLS policies for user-scoped access
```

---

## Repository Layout

```
017_simple_memo/
├── api/                     # Vercel serverless functions
│   ├── memo.ts              # REST shim around Supabase memos table
│   ├── refine.ts            # LangChain pipeline using Groq
│   ├── notion-sync.ts       # Bulk export memos to Notion
│   └── notion-test.ts       # Connectivity test endpoint
├── frontend/                # React + Vite application
│   ├── src/
│   │   ├── pages/           # Home, Record, Write, Result, MemoList, Settings
│   │   ├── hooks/           # Supabase and AI hooks (auto save, bulk ops)
│   │   ├── lib/             # i18n, tag styling, Notion helpers
│   │   ├── components/      # UI building blocks (TagEditor, Audio controls)
│   │   └── types/           # Shared TS definitions (Memo, contexts)
│   └── public/              # Static icons, manifest, PWA assets
├── supabase/                # SQL migrations (001–005) + policies
├── docs/                    # Design notes, product briefs
├── MIGRATION_GUIDE.md       # Transition notes (summary → refined)
└── vercel.json              # Build/Install commands for deployment
```

---

## Prerequisites

- **Node.js ≥ 18** (matches Vite & Vercel runtime requirements)  
- **npm** or **pnpm**  
- **Supabase CLI** (optional but recommended for local DB/migrations)  
- **Vercel CLI** for running serverless functions locally  
- **Groq API key** (free tier) or alternative LLM endpoint if you adapt the prompt  
- Supabase project (Postgres database + anon key + service-role key)

---

## Setup & Configuration

1. **Clone the repo**
   ```bash
   git clone https://github.com/davidlikescat/017_Snap_Note.git
   cd 017_Snap_Note
   ```

2. **Install dependencies**
   ```bash
   npm install --prefix api
   npm install --prefix frontend
   ```

3. **Environment variables**

   - Frontend (`frontend/.env.local`)
     ```bash
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=anon-key
     VITE_GROQ_API_KEY=gsk_xxx
     # Optional providers
     VITE_OPENROUTER_API_KEY=sk-or-xxx
     VITE_OLLAMA_BASE_URL=http://localhost:11434
     VITE_APP_NAME=Snap Note
     ```

   - Serverless functions (Vercel Project or `api/.env`)
     ```bash
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=service-role-key
     GROQ_API_KEY=gsk_xxx
     ```
     > Never expose the service-role key in client code; keep it on the serverless side only.

4. **Database migration (Supabase)**
   ```bash
    supabase link --project-ref <ref>       # optional if not already linked
    supabase db push                       # applies 001–005 migrations
   ```

5. **Run locally**
   ```bash
   # Start browser app
   cd frontend
   npm run dev

   # In another terminal (optional serverless emulation)
   cd ../api
   npm run dev    # wraps `vercel dev`
   ```

6. **Deploy (Vercel)**
   - `vercel.json` already instructs Vercel to install both workspaces:
     ```json
     {
       "installCommand": "npm install --prefix api && npm install --prefix frontend",
       "buildCommand": "npm run build --prefix frontend",
       "outputDirectory": "frontend/dist"
     }
     ```
   - Provide the environment variables in the Vercel dashboard before triggering a build.

---

## Core Workflows

### Capture & Refine
- **Record** uses the Web Speech API for in-browser STT and pushes audio metadata + raw transcript to the Result screen.  
- **Write** accepts manual text (or file uploads) up to `VITE_MAX_TEXT_LENGTH` characters; it triggers AI refinement automatically once the text, tags, and language are detected.

During refinement the Result view shows:
- Live progress messages/logs from the LangChain pipeline  
- Automatic save once refined text, at least one tag, and original text are present  
- A fallback banner if the Groq call fails (e.g., missing key or timeout)

### Organize & Browse
- `MemoList` provides search, language/context/tag filters, and inline editing.  
- Tags render with “Notion-like” palette chips and are localized when available.  
- Bulk selection supports move/share/export/delete actions; delete runs in 50-item chunks and surfaces a spinner + `processed/total` counter to avoid Supabase timeouts.

### Share & Integrate
- The share menu enables:
  - **System Share** via the Web Share API (mobile-friendly)
  - **Notion Sync** using `/api/notion-sync`, with a companion `/api/notion-test` endpoint in Settings to validate credentials
  - **Markdown Export** for quick backups
- Settings persist Notion API details and language preferences in local storage.

---

## Data Model (simplified)

```sql
CREATE TABLE memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refined TEXT CHECK (char_length(refined) <= 1000),
  original_text TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  context TEXT NOT NULL,
  insight TEXT,
  language TEXT DEFAULT 'en',
  audio_url TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  notion_synced BOOLEAN,
  notion_page_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  search_vector TSVECTOR
);
```

Migrations add support for multilingual search vectors, Notion sync metadata, and session-based access control.

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `Fallback Mode` banner on Result | Groq request failed, JSON parse error, or API key missing | Check Vercel logs for `/api/refine`, confirm `GROQ_API_KEY`, inspect raw response |
| Bulk delete spins forever | Large `UPDATE … IN` call timing out | The app now deletes in 50-item chunks and shows progress; if it still stalls, run a filtered `UPDATE/DELETE` via Supabase SQL |
| Vercel build looks for `frontend/api/package.json` | Legacy `--prefix` behavior | `vercel.json` already pins the working install command (`npm install --prefix api && npm install --prefix frontend`) |
| Notion sync fails | Wrong database permissions or API key | Use Settings → “Test Connection” (calls `/api/notion-test`) to verify credentials and add integration to the database |

---

## Roadmap Ideas

- Optional background queue for long-running exports  
- Unit tests around `tagStyles` and AI prompt helpers  
- Additional LLM providers (OpenRouter profiles, local Ollama)  
- UI for managing custom tag sets per language

---

## License & Credits

This project builds on open tooling (React, Supabase, Groq, LangChain) and is MIT-licensed.  
Refer to each dependency’s license for redistribution terms. Contributions and issue reports are welcome! 🎉

