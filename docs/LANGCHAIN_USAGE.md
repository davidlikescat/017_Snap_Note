# 🔗 LangChain Integration Guide

How MIND NOTE uses LangChain framework for AI refinement with FREE models.

---

## 🎯 Why LangChain?

- **Provider Agnostic**: Switch between Groq, OpenAI, Ollama easily
- **Built-in Retries**: Automatic error handling
- **Structured Output**: JSON parsing helpers
- **Community Models**: Access to 100+ free models
- **MIT License**: Free for commercial use

---

## 🏗️ Architecture

```
User Input (Text/Voice)
    ↓
[LangChain ChatGroq]
    ↓ (System Prompt)
[LLM: llama-3.1-70b-versatile]
    ↓ (JSON Response)
[Zod Validation]
    ↓
Refined Memo → Database
```

---

## 📝 Implementation Details

### 1. LangChain Setup

**File:** `api/refine.ts`

```typescript
import { ChatGroq } from "@langchain/groq";

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.1-70b-versatile",
  temperature: 0.3, // Lower = more consistent
  maxTokens: 1024,
});
```

**Why Groq?**
- Free tier: 14,400 requests/day
- Fast inference (< 1 second)
- Good at structured output (JSON)

### 2. Prompt Engineering

**Bilingual System Prompts:**

```typescript
const SYSTEM_PROMPTS = {
  en: `You are MIND AGENT, an AI memo refinement assistant...`,
  ko: `너는 MIND AGENT, AI 기록 비서다...`
};
```

**Prompt Strategy:**
1. Clear role definition
2. Exact output format (JSON schema)
3. Available tags/contexts listed
4. Strict rules (no markdown, explanations)

### 3. LangChain Invocation

```typescript
const response = await llm.invoke(fullPrompt);
const content = response.content as string;
```

**What we get:**
- `content`: String response from LLM
- Includes metadata (tokens, latency)

### 4. Response Parsing

```typescript
function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  return cleaned.trim();
}

const cleanedJson = cleanJsonResponse(content);
const parsed = JSON.parse(cleanedJson);
```

**Why needed?**
LLMs sometimes add:
- Markdown: ` ```json ... ``` `
- Explanations: "Here is the JSON:"
- Extra whitespace

### 5. Validation with Zod

```typescript
import { z } from "zod";

const RefinedMemoSchema = z.object({
  summary: z.string().max(500),
  tags: z.array(z.string()).min(1).max(3),
  context: z.string(),
  insight: z.string().optional(),
});

const validated = RefinedMemoSchema.parse(parsed);
```

**Benefits:**
- Type safety
- Runtime validation
- Clear error messages
- Auto-complete in IDE

---

## 🔄 Retry Logic

```typescript
let attempts = 0;
const maxAttempts = 3;

while (attempts < maxAttempts) {
  try {
    const response = await llm.invoke(fullPrompt);
    // ... parse and validate ...
    return validated; // Success!
  } catch (error) {
    attempts++;
    if (attempts >= maxAttempts) {
      // Fallback: return simple result
      return fallbackResult;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

**Why retry?**
- Network issues
- Rate limits
- Malformed JSON (rare)

**Fallback strategy:**
If all retries fail, return basic result:
```typescript
{
  summary: text.slice(0, 500),
  tags: ["#memo", "#note"],
  context: "Memory Archive",
  insight: ""
}
```

User still gets a saved memo!

---

## 🔌 Switching Providers

### Option 1: OpenAI (Paid)

```typescript
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o-mini", // Cheapest
  temperature: 0.3,
});
```

**Cost:** $0.15/1M input tokens (~$0.15 per 1000 memos)

### Option 2: Ollama (Free, Self-Hosted)

```typescript
import { Ollama } from "@langchain/community/llms/ollama";

const llm = new Ollama({
  baseUrl: "http://localhost:11434",
  model: "llama3.1:8b",
});
```

**Cost:** $0 (runs locally)
**Tradeoff:** Slower, needs GPU

### Option 3: OpenRouter (Multiple Free Models)

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

**Free models:**
- meta-llama/llama-3.1-8b-instruct:free
- google/gemma-2-9b-it:free
- mistralai/mistral-7b-instruct:free

### Option 4: Claude via Anthropic (Paid)

```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const llm = new ChatAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-3-haiku-20240307", // Cheapest
  temperature: 0.3,
});
```

**Cost:** $0.25/1M input tokens (~$0.25 per 1000 memos)

---

## 🎛️ Advanced Configuration

### Temperature Control

```typescript
temperature: 0.0  // Deterministic (same input = same output)
temperature: 0.3  // Slightly creative (recommended)
temperature: 0.7  // More creative
temperature: 1.0  // Very creative (not recommended for JSON)
```

**For MIND NOTE:** Use 0.3
- Consistent tag selection
- Reliable JSON format
- Slight variation in insights

### Token Limits

```typescript
maxTokens: 1024  // ~750 words
maxTokens: 2048  // ~1500 words (more expensive)
```

**For MIND NOTE:** 1024 is enough
- Summary: ~200 chars
- Tags: 3 items
- Context: 1 word
- Insight: ~100 chars
- Total: ~400 chars = ~100 tokens

### Timeout Handling

```typescript
const llm = new ChatGroq({
  // ... other config ...
  timeout: 30000, // 30 seconds
});
```

If timeout, return fallback result.

---

## 📊 Performance Optimization

### 1. Prompt Caching (Future)

```typescript
// Cache system prompts (expensive)
const CACHED_SYSTEM_PROMPT = memoize(
  (lang: 'en' | 'ko') => SYSTEM_PROMPTS[lang]
);
```

### 2. Batch Processing (Future)

```typescript
// Refine multiple memos at once
const memos = ["memo1", "memo2", "memo3"];
const batchPrompt = `
${SYSTEM_PROMPT}

Process these memos and return array of results:
1. ${memos[0]}
2. ${memos[1]}
3. ${memos[2]}
`;
```

Saves API calls!

### 3. Streaming Responses (Future)

```typescript
const stream = await llm.stream(prompt);

for await (const chunk of stream) {
  // Update UI in real-time
  console.log(chunk.content);
}
```

Better UX for long responses.

---

## 🧪 Testing LangChain Integration

### Test Script

Create `api/test-refine.ts`:

```typescript
import { ChatGroq } from "@langchain/groq";

async function testRefinement() {
  const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY!,
    model: "llama-3.1-70b-versatile",
    temperature: 0.3,
  });

  const testCases = [
    "I had an idea for a new app today",
    "Met with the team about Q1 goals",
    "오늘 새로운 앱 아이디어가 떠올랐어요",
  ];

  for (const text of testCases) {
    console.log(`\nTesting: "${text}"`);
    const response = await llm.invoke(text);
    console.log("Response:", response.content);
  }
}

testRefinement();
```

Run:
```bash
cd api
npx tsx test-refine.ts
```

---

## 🚨 Error Handling

### Common Errors

**1. Rate Limit (429)**
```typescript
if (error.status === 429) {
  // Wait and retry, or use fallback provider
  await sleep(1000);
  return await fallbackLLM.invoke(prompt);
}
```

**2. Invalid JSON**
```typescript
try {
  const parsed = JSON.parse(cleaned);
} catch (e) {
  console.error("JSON parse failed:", cleaned);
  return fallbackResult;
}
```

**3. Timeout**
```typescript
const timeout = new Promise((_, reject) =>
  setTimeout(() => reject(new Error("Timeout")), 30000)
);

const response = await Promise.race([
  llm.invoke(prompt),
  timeout
]);
```

---

## 📚 LangChain Resources

**Official Docs:**
- [LangChain.js Docs](https://js.langchain.com/)
- [Groq Provider](https://js.langchain.com/docs/integrations/chat/groq)
- [Chat Models](https://js.langchain.com/docs/modules/model_io/chat)

**Tutorials:**
- [Structured Output](https://js.langchain.com/docs/guides/structured_output)
- [Prompt Templates](https://js.langchain.com/docs/modules/model_io/prompts)
- [Error Handling](https://js.langchain.com/docs/guides/error_handling)

**Community:**
- [Discord](https://discord.gg/langchain)
- [GitHub](https://github.com/langchain-ai/langchainjs)

---

## 🎓 Best Practices

1. **Always validate LLM output** with Zod
2. **Use lower temperature** for structured output
3. **Implement retries** for reliability
4. **Have fallbacks** for errors
5. **Monitor API usage** daily
6. **Test with real data** before production
7. **Cache prompts** when possible
8. **Log failures** for debugging

---

## 🔮 Future Enhancements

### Phase 2: Advanced Features

**1. Multi-Agent System**
```typescript
const tagAgent = new ChatGroq({ model: "llama-3.1-70b" });
const summaryAgent = new ChatGroq({ model: "llama-3.1-8b" });

// Different agents for different tasks
const tags = await tagAgent.invoke(tagPrompt);
const summary = await summaryAgent.invoke(summaryPrompt);
```

**2. Memory/Context**
```typescript
import { BufferMemory } from "langchain/memory";

const memory = new BufferMemory();
// Remember user preferences
await memory.saveContext(
  { input: "I like short summaries" },
  { output: "Noted!" }
);
```

**3. Semantic Search with Embeddings**
```typescript
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings();
const vector = await embeddings.embedQuery("search query");
// Store in Supabase pgvector
```

---

**LangChain makes AI integration simple and reliable!** 🚀
