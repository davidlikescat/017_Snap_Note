# 💰 Free Tier Cost Optimization Guide

Complete guide to keeping MIND NOTE 100% FREE using free-tier services.

---

## 🎯 Target: $0/month for MVP

| Service | Free Tier | Usage Estimate (1000 memos/month) | Cost |
|---------|-----------|-----------------------------------|------|
| Groq API | 14,400 requests/day | ~1000 refinements | $0 |
| Supabase | 500MB DB + 2GB bandwidth | ~50MB + 500MB | $0 |
| Vercel | 100GB bandwidth | ~10GB | $0 |
| **TOTAL** | | | **$0** |

---

## 1️⃣ Groq API (LLM) - FREE

### What You Get
- **14,400 requests per day** (432,000/month)
- Fast models: llama-3.1-70b, mixtral-8x7b
- No credit card required
- Production-ready

### Cost Optimization Tips

#### Use Efficient Models
```typescript
// Recommended: Fast and free
model: "llama-3.1-70b-versatile"

// Alternative: Lighter model
model: "gemma-7b-it"
```

#### Batch Requests (Future)
Instead of refining each memo immediately, batch them:
```typescript
// Refine multiple memos in one call
const memos = ["memo1", "memo2", "memo3"];
const batchPrompt = memos.join("\n---\n");
```

#### Cache Results
```typescript
// Cache frequent refinements
const cache = new Map();
if (cache.has(textHash)) {
  return cache.get(textHash);
}
```

### Monitoring
- Dashboard: [https://console.groq.com/usage](https://console.groq.com/usage)
- Set alerts when approaching limits
- Free tier resets daily

---

## 2️⃣ Web Speech API (STT) - FREE

### What You Get
- **Unlimited** speech-to-text
- Browser-native (Chrome, Edge, Safari)
- Real-time transcription
- Multi-language support

### Implementation
```typescript
const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US'; // or 'ko-KR'

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  // Use transcript for refinement
};
```

### Fallback Option: Groq Whisper
If Web Speech API isn't available:
```bash
# Groq also offers Whisper API (free tier)
curl https://api.groq.com/openai/v1/audio/transcriptions \
  -F file=@audio.mp3 \
  -F model=whisper-large-v3
```

**Limits:** Same 14,400 requests/day

---

## 3️⃣ Supabase (Database) - FREE

### What You Get
- 500MB database storage
- 2GB file storage (for audio files)
- 5GB bandwidth/month
- 50,000 monthly active users
- Unlimited API requests

### Optimization Strategies

#### 1. Compress Audio Files
```typescript
// Use Opus codec (smallest size)
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 16000 // 16kbps
});

// 1 minute audio ≈ 120KB (vs 1MB uncompressed)
```

#### 2. Lazy Delete Audio Files
```typescript
// Keep audio for 30 days, then auto-delete
CREATE POLICY "Auto delete old audio" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'audio' AND
    created_at < NOW() - INTERVAL '30 days'
  );
```

#### 3. Use Text Search Instead of Embeddings
```sql
-- Text search is free and fast
SELECT * FROM memos
WHERE search_vector @@ to_tsquery('english', 'keyword');

-- Embeddings (pgvector) use more storage
-- Save for Phase 3
```

#### 4. Efficient Indexing
```sql
-- Only index non-deleted memos
CREATE INDEX idx_active_memos ON memos(created_at DESC)
WHERE is_deleted = FALSE;
```

### Monitoring
- Dashboard: [https://app.supabase.com](https://app.supabase.com)
- Check "Usage" tab
- Set up alerts at 80% capacity

---

## 4️⃣ Vercel (Hosting) - FREE

### What You Get
- 100GB bandwidth/month
- 100 deployments/day
- Unlimited websites
- Automatic HTTPS
- Edge Functions (serverless)

### Optimization

#### 1. Optimize Bundle Size
```bash
# Analyze bundle
npm run build
npx vite-bundle-visualizer

# Remove unused dependencies
npm prune
```

#### 2. Image Optimization
```typescript
// Use WebP format
// Lazy load images
<img loading="lazy" src="icon.webp" />
```

#### 3. Enable Caching
```typescript
// vercel.json
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Monitoring
- Dashboard: [https://vercel.com/dashboard/usage](https://vercel.com/dashboard/usage)
- Track bandwidth usage
- Free tier is very generous

---

## 🚨 When You Might Exceed Free Tier

### Scenario 1: Viral Growth (10,000+ users)
**Problem:** Vercel bandwidth or Supabase requests

**Solution:**
1. Add Cloudflare (free CDN) in front
2. Implement aggressive caching
3. Move to Supabase Pro ($25/month) or self-host

### Scenario 2: Heavy Audio Storage
**Problem:** 2GB audio storage limit

**Solution:**
1. Don't store audio by default
2. Let users opt-in to save audio
3. Auto-delete audio after 7 days
4. Use Cloudflare R2 (free tier: 10GB)

### Scenario 3: API Rate Limits
**Problem:** >14,400 Groq requests/day

**Solution:**
1. Add request queuing
2. Cache refinements
3. Use local LLM (Ollama) as fallback
4. Rotate between free APIs (Groq, OpenRouter, HuggingFace)

---

## 💡 Alternative Free Services

### If Groq Limits Reached

**Option 1: OpenRouter (Free Models)**
```typescript
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  },
  model: "meta-llama/llama-3.1-8b-instruct:free",
});
```

Free models on OpenRouter:
- `meta-llama/llama-3.1-8b-instruct:free`
- `google/gemma-2-9b-it:free`
- `mistralai/mistral-7b-instruct:free`

**Option 2: Ollama (Self-Hosted)**
```bash
# Run locally or on Railway (free tier)
ollama run llama3.1:8b

# Zero cost, slower response
```

**Option 3: HuggingFace Inference API**
```typescript
import { HuggingFaceInference } from "@langchain/community/llms/hf";

const llm = new HuggingFaceInference({
  model: "mistralai/Mistral-7B-Instruct-v0.2",
  apiKey: process.env.HUGGINGFACEHUB_API_KEY,
});
```

Free tier: 30,000 requests/month

---

## 📊 Real-World Usage Estimates

### Conservative MVP (100 users, 10 memos/user/month)
- Groq requests: 1,000/month (0.002% of limit)
- Supabase DB: ~10MB (2% of limit)
- Vercel bandwidth: ~5GB (5% of limit)
- **Cost: $0**

### Moderate Growth (1,000 users, 10 memos/user/month)
- Groq requests: 10,000/month (0.02% of limit)
- Supabase DB: ~100MB (20% of limit)
- Vercel bandwidth: ~50GB (50% of limit)
- **Cost: $0**

### Heavy Usage (5,000 users, 20 memos/user/month)
- Groq requests: 100,000/month (0.2% of limit)
- Supabase DB: ~400MB (80% of limit) ⚠️
- Vercel bandwidth: ~90GB (90% of limit) ⚠️
- **Cost: $0** (but monitor closely)

---

## 🎓 Best Practices

### 1. Monitor Daily
```bash
# Create monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
echo "Checking Groq usage..."
curl -H "Authorization: Bearer $GROQ_API_KEY" \
  https://api.groq.com/usage

echo "Checking Supabase usage..."
# Check dashboard manually
EOF
```

### 2. Implement Rate Limiting
```typescript
// Limit to 10 refinements per user per hour
const rateLimit = new Map();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimit.get(userId) || [];
  const recentRequests = userRequests.filter(
    (time) => now - time < 3600000
  );

  if (recentRequests.length >= 10) {
    return false; // Rate limited
  }

  recentRequests.push(now);
  rateLimit.set(userId, recentRequests);
  return true;
}
```

### 3. Add Fallbacks
```typescript
async function refineMemo(text: string) {
  try {
    return await groqRefine(text);
  } catch (error) {
    if (error.status === 429) {
      // Rate limited, use fallback
      return await openRouterRefine(text);
    }
    throw error;
  }
}
```

---

## 🎯 Scaling Plan (When Free Tier Isn't Enough)

### Tier 1: Still Free ($0/month)
- 10,000+ users
- Add Cloudflare CDN
- Use multiple free API keys (rotation)
- Aggressive caching

### Tier 2: Basic Paid ($25/month)
- 50,000+ users
- Supabase Pro: $25/month
- Still using free Groq + Vercel

### Tier 3: Full Paid ($100/month)
- 100,000+ users
- Supabase Pro: $25/month
- Vercel Pro: $20/month
- Groq Paid: $50/month (if needed)

---

## ✅ Checklist: Staying Free

- [ ] Use Groq (not OpenAI/Claude)
- [ ] Web Speech API for STT
- [ ] Compress audio files (Opus codec)
- [ ] Don't store audio by default
- [ ] Use text search (not embeddings)
- [ ] Optimize bundle size
- [ ] Enable caching
- [ ] Monitor usage weekly
- [ ] Set up rate limiting
- [ ] Have API fallbacks ready

---

**You can absolutely run MIND NOTE for FREE!** 🎉

The key is monitoring and optimization. With these strategies, you can serve thousands of users at $0/month.
