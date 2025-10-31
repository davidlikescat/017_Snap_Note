# ⚡ Quick Start Guide

Get MIND NOTE running in 5 minutes!

---

## 🎯 What You'll Build

A working AI-powered memo app that:
- Records voice or text input
- Refines content with AI (FREE)
- Saves to database
- Searchable with tags

**Cost:** $0 using free tiers

---

## 🚀 5-Minute Setup

### Step 1: Get API Keys (2 min)

**Groq API (FREE):**
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up (email or GitHub)
3. Create API key → Copy it (`gsk_...`)

**Supabase (FREE):**
1. Visit [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → API → Copy:
   - Project URL
   - `anon` public key

### Step 2: Install Dependencies (1 min)

```bash
cd frontend
npm install
```

### Step 3: Configure Environment (1 min)

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `.env.local`:
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_GROQ_API_KEY=gsk_xxx...
```

### Step 4: Setup Database (1 min)

1. Open Supabase SQL Editor
2. Copy content from `supabase/migrations/001_create_memos_table.sql`
3. Click "Run"
4. ✅ Table created!

### Step 5: Start App!

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🧪 Test It Works

### Test 1: Text Input
1. Click "Write Text"
2. Type: "I had a great idea for a new app today"
3. Click "Refine with AI"
4. See AI categorization!
5. Click "Save"

### Test 2: Voice Input
1. Click "Record Voice"
2. Say: "Meeting with team tomorrow at 2pm"
3. Browser transcribes automatically
4. AI refines and categorizes
5. Save!

### Test 3: View Memos
1. Click "View All Memos"
2. See your saved memos
3. Search and filter

---

## 🎨 What's Included

### Frontend (React + TypeScript)
- ✅ Voice recording (Web Speech API)
- ✅ Text input with character counter
- ✅ AI refinement UI
- ✅ Memo list with filters
- ✅ Mobile-responsive design
- ✅ PWA ready (install as app)

### Backend (Vercel Serverless)
- ✅ LangChain + Groq integration
- ✅ Bilingual support (EN/KO)
- ✅ Automatic retry logic
- ✅ JSON validation with Zod
- ✅ RESTful API

### Database (Supabase)
- ✅ PostgreSQL with full-text search
- ✅ Auto-updating timestamps
- ✅ Soft delete support
- ✅ RLS (Row Level Security)

---

## 📊 Architecture

```
┌─────────────┐
│   Browser   │
│  (React UI) │
└─────┬───────┘
      │
      ├─→ Web Speech API (STT)
      │
      ├─→ /api/refine (LangChain + Groq)
      │
      └─→ /api/memo (CRUD)
             │
             └─→ Supabase (PostgreSQL)
```

**Everything runs FREE!**

---

## 🔧 Common Issues

### "Microphone not working"
- **Fix:** Allow microphone permission in browser
- **Note:** HTTPS required (localhost works)

### "GROQ_API_KEY not configured"
- **Fix:** Check `.env.local` has the right key
- **Format:** Must start with `gsk_`

### "Failed to fetch memos"
- **Fix:** Verify Supabase URL is correct
- **Fix:** Check SQL migration ran successfully

### "AI refinement returns error"
- **Fix:** Test Groq API key at [console.groq.com](https://console.groq.com)
- **Note:** Free tier = 14,400 requests/day

---

## 📱 Install as PWA

### Desktop (Chrome/Edge)
1. Visit the app
2. Look for install icon in address bar
3. Click "Install"
4. App opens in standalone window

### Mobile (iOS Safari)
1. Open app in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Launch like native app

---

## 🎓 Next Steps

### Customize
- [ ] Edit tag categories in `frontend/src/lib/constants.ts`
- [ ] Modify AI prompts in `api/refine.ts`
- [ ] Change colors in `frontend/tailwind.config.js`

### Deploy to Production
```bash
npm install -g vercel
vercel login
vercel --prod
```

Your app is live! 🚀

### Add Features
- [ ] User authentication (Supabase Auth)
- [ ] Export to CSV/Notion
- [ ] Weekly AI summaries
- [ ] Voice playback
- [ ] Dark mode

---

## 📚 Documentation

- [Full Setup Guide](./docs/SETUP.md)
- [Free Tier Optimization](./docs/FREE_TIER_GUIDE.md)
- [LangChain Usage](./docs/LANGCHAIN_USAGE.md)

---

## 🆘 Need Help?

1. Check [docs/SETUP.md](./docs/SETUP.md) for detailed instructions
2. Review error messages in browser console
3. Test API keys manually
4. Check Supabase logs

---

## 🎉 You're All Set!

You now have a working AI memo system that:
- ✅ Records voice or text
- ✅ Refines with AI (Groq + LangChain)
- ✅ Saves to database (Supabase)
- ✅ Fully searchable
- ✅ Works offline (PWA)
- ✅ 100% FREE

**Happy memo-ing!** 📝✨

---

## 🔗 Useful Links

- [Groq Console](https://console.groq.com)
- [Supabase Dashboard](https://app.supabase.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [LangChain Docs](https://js.langchain.com)

---

Built with ❤️ using React, LangChain, and Supabase
