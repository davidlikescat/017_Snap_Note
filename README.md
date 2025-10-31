# 🧠 MIND NOTE - AI-Powered Memo System

> Transform your thoughts into organized knowledge with AI

**Voice/Text → AI Refinement → Searchable Knowledge Base**

---

## 🎯 Features

- 🎙️ **Voice Recording** - Real-time speech-to-text with Web Speech API
- 🤖 **AI Refinement** - Automatic summarization and categorization via LangChain
- 🏷️ **Smart Tagging** - AI-generated tags from predefined categories
- 🔍 **Full-Text Search** - Find memos instantly with PostgreSQL search
- 📱 **PWA Ready** - Install as native app, works offline
- 🌐 **Multilingual** - English and Korean support

---

## 🏗️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite 5
- TailwindCSS + shadcn/ui
- Zustand (State Management)
- React Router 6
- Workbox (PWA)

### Backend
- Vercel Serverless Functions
- LangChain (AI Framework)
- Supabase (PostgreSQL + Auth + Storage)

### AI Services (FREE Tier)
- **STT**: Web Speech API (browser native)
- **LLM**: Groq API (free, fast) or Ollama (local)
- **Framework**: LangChain (MIT license)

---

## 📦 Installation

### Prerequisites
```bash
Node.js 18+
npm or pnpm
Supabase account (free tier)
Groq API key (free at https://console.groq.com)
```

### Setup

1. **Clone and install dependencies**
```bash
cd frontend
npm install
```

2. **Set up environment variables**
```bash
cp .env.local.example .env.local
# Edit .env.local with your keys
```

3. **Initialize Supabase**
```bash
# Run migrations
supabase db push
```

4. **Start development server**
```bash
npm run dev
```

---

## 🗂️ Project Structure

```
017_simple_memo/
├── frontend/                  # React PWA
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities
│   │   ├── pages/           # Route pages
│   │   ├── store/           # Zustand stores
│   │   └── types/           # TypeScript types
│   └── public/              # Static assets
├── api/                      # Vercel Serverless
│   ├── refine.ts            # LangChain AI refinement
│   ├── memo.ts              # CRUD operations
│   └── search.ts            # Full-text search
└── supabase/
    └── migrations/          # Database schema
```

---

## 🚀 Usage

### Recording a Memo

1. Click the **🎙️ Record** button
2. Speak your thoughts (auto-transcription)
3. Review AI-refined summary
4. Edit tags/context if needed
5. Save to database

### Text Input

1. Click **✍️ Write** button
2. Type your memo (200 char limit)
3. AI refines and categorizes
4. Save

### Searching Memos

- Use the search bar for full-text search
- Filter by tags (multi-select)
- Filter by context (single-select)
- Sort by date

---

## 🗃️ Database Schema

### Memos Table
```sql
CREATE TABLE memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary TEXT NOT NULL CHECK (char_length(summary) <= 200),
  tags TEXT[] NOT NULL CHECK (array_length(tags, 1) <= 3),
  context TEXT NOT NULL,
  insight TEXT,
  original_text TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🏷️ Tag Categories

### Available Tags
- **Ideas**: #idea, #inspiration, #concept, #brainstorm
- **Learning**: #learning, #notes, #insight, #coaching
- **Reflection**: #emotion, #reflection, #gratitude, #diary
- **People**: #people, #conversation, #observation, #feedback
- **Business**: #work, #project, #marketing, #strategy
- **Philosophy**: #philosophy, #values, #mindset, #belief
- **Creative**: #writing, #content, #story
- **Goals**: #vision, #goals, #future, #habits

### Context Types
- Idea, Work Memo, Meeting Notes, Teaching Idea
- Coaching Note, Personal Reflection, Memory Log
- Observation Note, Inspiration, Philosophy Memo
- Content Idea, Story Note, Goal Setting, Habit Log

---

## 🔧 Configuration

### Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# Groq API (FREE)
GROQ_API_KEY=gsk_xxx

# Optional: OpenRouter (multiple free models)
OPENROUTER_API_KEY=sk-or-xxx
```

---

## 🎨 AI Prompt Configuration

The AI refinement prompt is in [`api/refine.ts`](api/refine.ts). Customize it to change:
- Summary style
- Tag selection logic
- Insight generation

---

## 📱 PWA Installation

### Desktop
1. Visit the app URL
2. Click the install icon in the address bar
3. App opens in standalone window

### Mobile
1. Open in Safari/Chrome
2. Tap "Add to Home Screen"
3. Launch like a native app

---

## 🛣️ Roadmap

### Phase 1 (MVP) ✅
- [x] Voice recording + STT
- [x] AI refinement with LangChain
- [x] Basic CRUD operations
- [x] Tag/context filtering

### Phase 2 (Upcoming)
- [ ] User authentication (Supabase Auth)
- [ ] Export to CSV/Notion
- [ ] AI weekly summaries
- [ ] Offline sync

### Phase 3 (Future)
- [ ] Semantic search (embeddings)
- [ ] Voice playback
- [ ] Multi-language support expansion
- [ ] Mobile apps (React Native)

---

## 💰 Cost Analysis (MVP)

| Service | Free Tier | Cost at 1000 memos/month |
|---------|-----------|--------------------------|
| Groq API | 14,400 requests/day | $0 |
| Supabase | 500MB database | $0 |
| Vercel | 100GB bandwidth | $0 |
| **Total** | | **$0** |

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Submit a PR with tests

---

## 📄 License

MIT License - feel free to use for personal or commercial projects

---

## 🙋 Support

- 📖 [Documentation](./docs/)
- 🐛 [Report Issues](https://github.com/yourusername/mind-note/issues)
- 💬 [Discussions](https://github.com/yourusername/mind-note/discussions)

---

**Built with ❤️ using LangChain, React, and Supabase**
