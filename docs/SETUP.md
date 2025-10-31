# 🚀 Setup Guide for MIND NOTE

Complete setup instructions for getting MIND NOTE running locally and deploying to production.

---

## 📋 Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Supabase account (free tier)
- Groq API account (free tier)

---

## 1️⃣ Get API Keys

### Groq API (FREE)
1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create new API key
5. Copy the key (starts with `gsk_...`)

**Free Tier Limits:**
- 14,400 requests per day
- llama-3.1-70b-versatile model
- Perfect for MVP!

### Supabase
1. Go to [https://supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → API
4. Copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key (for backend only)

---

## 2️⃣ Database Setup

### Run Migration

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link to your project:
```bash
cd /path/to/017_simple_memo
supabase link --project-ref your-project-ref
```

4. Run migrations:
```bash
supabase db push
```

Or manually run the SQL from `supabase/migrations/001_create_memos_table.sql` in Supabase SQL Editor.

### Verify Schema

Run this in Supabase SQL Editor:
```sql
SELECT * FROM memos;
```

Should see empty table with correct columns.

### Seed Test Data (Optional)

```bash
psql your-database-url < supabase/seed.sql
```

Or run `supabase/seed.sql` manually in SQL Editor.

---

## 3️⃣ Frontend Setup

### Install Dependencies

```bash
cd frontend
npm install
```

### Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_GROQ_API_KEY=gsk_xxx...
```

### Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 4️⃣ Backend API Setup

### Install Dependencies

```bash
cd ../api
npm install
```

### Test Locally with Vercel CLI

```bash
npm install -g vercel
vercel dev
```

This runs API endpoints at `http://localhost:3000/api/*`

---

## 5️⃣ Test the Application

### Test Voice Recording

1. Go to Home → Record Voice
2. Click microphone button
3. Speak a test memo
4. Browser should transcribe automatically (Web Speech API)

### Test Text Input

1. Go to Home → Write Text
2. Type a test memo
3. Click "Refine with AI"
4. Should see AI refinement result

### Test Saving

1. After refinement, click "Save Memo"
2. Go to "View All Memos"
3. Should see your saved memo

---

## 6️⃣ Deploy to Production

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login:
```bash
vercel login
```

3. Deploy:
```bash
cd /path/to/017_simple_memo
vercel
```

4. Set environment variables in Vercel dashboard:
   - GROQ_API_KEY
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY

5. Redeploy:
```bash
vercel --prod
```

### Configure Custom Domain (Optional)

1. Go to Vercel dashboard → Domains
2. Add your custom domain
3. Update DNS records
4. HTTPS is automatic!

---

## 🔧 Troubleshooting

### Voice Recording Not Working

**Issue:** Browser asks for microphone permission
**Solution:** Allow microphone access in browser settings

**Issue:** Voice transcription not working
**Solution:** Web Speech API only works with HTTPS (or localhost). Deploy to get HTTPS.

### AI Refinement Failing

**Issue:** "GROQ_API_KEY not configured"
**Solution:** Check `.env.local` has correct key

**Issue:** Rate limit errors
**Solution:** Groq free tier has limits. Wait or upgrade.

### Database Connection Failed

**Issue:** "Failed to fetch memos"
**Solution:**
1. Check Supabase URL is correct
2. Verify RLS policies are enabled
3. Check migrations ran successfully

### PWA Not Installing

**Issue:** "Install" button doesn't appear
**Solution:**
1. Must be on HTTPS (localhost is OK)
2. Check `manifest.json` is valid
3. Ensure service worker registered

---

## 📊 Monitoring

### Check API Usage

**Groq Dashboard:**
- [https://console.groq.com/usage](https://console.groq.com/usage)
- Track request count
- Monitor rate limits

**Supabase Dashboard:**
- Database size
- API requests
- Auth users (when enabled)

---

## 🎨 Customization

### Change AI Model

Edit `api/refine.ts`:
```typescript
const llm = new ChatGroq({
  model: "mixtral-8x7b-32768", // Change model
  temperature: 0.5, // Adjust creativity
});
```

Available free models:
- `llama-3.1-70b-versatile` (recommended)
- `mixtral-8x7b-32768`
- `gemma-7b-it`

### Modify Tag Categories

Edit `frontend/src/lib/constants.ts`:
```typescript
export const TAG_CATEGORIES = {
  IDEAS: {
    en: ['#idea', '#custom-tag'],
    ko: ['#아이디어', '#커스텀태그']
  },
  // Add more categories
};
```

Update system prompt in `api/refine.ts` to match.

---

## 🆘 Need Help?

1. Check logs:
   - Vercel: `vercel logs`
   - Browser: DevTools Console
   - Supabase: Dashboard → Logs

2. Common issues: See Troubleshooting section above

3. Report bugs: GitHub Issues

---

**Ready to start building!** 🚀
