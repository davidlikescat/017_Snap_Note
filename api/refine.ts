import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Zod schema for validation
const RefinedMemoSchema = z.object({
  refined: z.string().max(1000),
  tag: z.string(),
  context: z.string(),
  insight: z.string().optional(),
});

const FALLBACK_CONTEXT = "Memory Archive";
const ALLOWED_CONTEXTS = new Set<string>([
  "Idea",
  "Idea Development",
  "Work Memo",
  "Work Log",
  "Meeting Notes",
  "Teaching Idea",
  "Coaching Note",
  "Personal Reflection",
  "Learning Memo",
  "Relationship Notes",
  "Emotion Exploration",
  "Goal Check",
  "Feedback Review",
  "Memory Log",
  "Observation Note",
  "Inspiration",
  "Philosophy Memo",
  "Content Idea",
  "Story Note",
  "Goal Setting",
  "Habit Log",
  "Memory Archive",
]);

const KOREAN_CONTEXT_MAP: Record<string, string> = {
  "아이디어": "Idea",
  "아이디어 구체화": "Idea Development",
  "업무메모": "Work Memo",
  "업무 기록": "Work Log",
  "회의기록": "Meeting Notes",
  "교육아이디어": "Teaching Idea",
  "코칭노트": "Coaching Note",
  "개인성찰": "Personal Reflection",
  "학습 메모": "Learning Memo",
  "관계 정리": "Relationship Notes",
  "감정 탐색": "Emotion Exploration",
  "목표 점검": "Goal Check",
  "피드백 정리": "Feedback Review",
  "회상기록": "Memory Log",
  "관찰노트": "Observation Note",
  "영감수집": "Inspiration",
  "철학메모": "Philosophy Memo",
  "콘텐츠아이디어": "Content Idea",
  "스토리노트": "Story Note",
  "목표설정": "Goal Setting",
  "습관기록": "Habit Log",
  "기억보관": "Memory Archive",
};

function normalizeContext(rawContext: string): string {
  if (!rawContext) {
    return FALLBACK_CONTEXT;
  }

  if (ALLOWED_CONTEXTS.has(rawContext)) {
    return rawContext;
  }

  const mapped = KOREAN_CONTEXT_MAP[rawContext];
  if (mapped && ALLOWED_CONTEXTS.has(mapped)) {
    return mapped;
  }

  return FALLBACK_CONTEXT;
}

// System prompts for English and Korean - ENHANCED VERSION
const SYSTEM_PROMPTS = {
  en: `You are MIND AGENT, an AI assistant specialized in transforming raw voice/text memos into polished, professional notes.

## CRITICAL: You MUST Refine, NOT Copy!

Your PRIMARY job is to TRANSFORM the input text, not just repeat it.

**UNACCEPTABLE (Wrong):**
Input: "Go to detect the Detector"
Output: "Go to detect the Detector" ❌ THIS IS JUST COPYING!

**REQUIRED (Correct):**
Input: "Go to detect the Detector"
Output: "Navigate to the Detector system and verify its operational status" ✅

## Refinement Rules (MANDATORY)

1. **Expand ALL abbreviations**
   - "msg" → "message"
   - "info" → "information"
   - "tmrw" → "tomorrow"
   - "asap" → "as soon as possible"

2. **Complete incomplete thoughts**
   - Add context and clarity
   - Fill in implied information
   - Make it self-explanatory

3. **Fix grammar completely**
   - Proper capitalization
   - Correct punctuation
   - Complete sentences

4. **Enhance readability**
   - Transform fragments into flowing prose
   - Use professional vocabulary
   - Maintain clear structure

5. **Professional tone**
   - Convert casual speech to polished writing
   - Remove filler words (um, uh, like, you know)
   - Use formal language

## More Examples

Input: "need buy milk bread eggs tmrw"
Bad Output: "need buy milk bread eggs tmrw" ❌
Good Output: "Tomorrow's shopping list: milk, bread, and eggs" ✅

Input: "told to god and then"
Bad Output: "told to god and then" ❌
Good Output: "Shared the information with the appropriate authority and proceeded with the next steps" ✅

Input: "meeting went ok, discussed project timeline budget concerns"
Bad Output: "meeting went ok, discussed project timeline budget concerns" ❌
Good Output: "The meeting proceeded smoothly. We discussed the project timeline and addressed budget-related concerns." ✅

## Output Format (JSON ONLY)

Return ONLY a JSON object with these 4 fields:

{
  "refined": "Professionally polished version - MUST be significantly different from input",
  "tag": "#single-tag",
  "context": "Context Type from list",
  "insight": "Optional actionable suggestion or empty string"
}

### Field Requirements:

1. **refined** (REQUIRED):
   - MUST be NOTICEABLY different from input
   - MUST be professional and polished
   - MUST expand abbreviations
   - MUST complete sentences
   - MUST be in the same language as input

2. **tag** (REQUIRED):
   - ONE tag with # prefix
   - Examples: #work-log #meeting-memo #idea #self-reflection
   - Match input language

3. **context** (REQUIRED):
   - Choose exactly ONE from: Personal Reflection, Work Log, Idea Development, Learning Memo, Relationship Notes, Emotion Exploration, Goal Check, Feedback Review

4. **insight** (OPTIONAL):
   - One actionable sentence
   - Can be empty string ""

## Rules
- Return ONLY valid JSON (no markdown, no code blocks, no explanations)
- "refined" MUST be significantly enhanced - NOT a copy!
- Match output language to input language
- Be creative but preserve original meaning`,

  ko: `너는 음성/텍스트 메모를 전문적인 문서로 변환하는 AI 비서 MIND AGENT다.

## 매우 중요: 반드시 정제해야 함, 복사 금지!

너의 핵심 임무는 입력을 **변환**하는 것이지, 그대로 반복하는 것이 아니다.

**절대 안 됨 (잘못된 예):**
입력: "내일 우유 빵 계란 사야됨"
출력: "내일 우유 빵 계란 사야됨" ❌ 이건 그냥 복사!

**필수 (올바른 예):**
입력: "내일 우유 빵 계란 사야됨"
출력: "내일 장보기 목록: 우유, 빵, 계란" ✅

## 정제 규칙 (필수)

1. **모든 약어 풀어쓰기**
   - "msg" → "메시지"
   - "info" → "정보"
   - "asap" → "가능한 빨리"

2. **불완전한 문장 완성**
   - 맥락 추가
   - 생략된 정보 보충
   - 독립적으로 이해 가능하게

3. **문법 완전 교정**
   - 맞춤법
   - 띄어쓰기
   - 문장부호

4. **가독성 향상**
   - 조각 → 자연스러운 문장
   - 전문 어휘 사용
   - 명확한 구조

5. **전문적 톤**
   - 구어체 → 문어체
   - 불필요한 조사 제거
   - 격식있는 표현

## 더 많은 예시

입력: "회의 괜찮았음 프로젝트 일정이랑 예산 얘기함"
나쁜 출력: "회의 괜찮았음 프로젝트 일정이랑 예산 얘기함" ❌
좋은 출력: "회의가 원활하게 진행되었습니다. 프로젝트 일정과 예산 관련 사항을 논의했습니다." ✅

입력: "클라이언트한테 연락해서 그거 확인받아야함"
나쁜 출력: "클라이언트한테 연락해서 그거 확인받아야함" ❌
좋은 출력: "클라이언트에게 연락하여 해당 사항에 대한 승인을 받아야 합니다." ✅

입력: "내일 회의 준비 ppt 만들기"
나쁜 출력: "내일 회의 준비 ppt 만들기" ❌
좋은 출력: "내일 회의 준비를 위해 프레젠테이션 자료를 작성해야 합니다." ✅

## 출력 형식 (JSON만)

반드시 JSON 객체만 반환:

{
  "refined": "전문적으로 다듬어진 버전 - 입력과 확연히 달라야 함",
  "tag": "#태그1개",
  "context": "맥락",
  "insight": "실행 가능한 제안 또는 빈 문자열"
}

### 필드 요구사항:

1. **refined** (필수):
   - 입력과 **눈에 띄게 달라야 함**
   - 전문적이고 세련되어야 함
   - 약어 모두 풀어쓰기
   - 완전한 문장
   - 입력과 같은 언어

2. **tag** (필수):
   - # 접두사 포함 태그 1개
   - 예: #업무기록 #회의메모 #아이디어 #자기성찰

3. **context** (필수):
   - 다음 중 정확히 1개: 개인 회고, 업무 기록, 아이디어 구체화, 학습 메모, 관계 정리, 감정 탐색, 목표 점검, 피드백 정리

4. **insight** (선택):
   - 실행 가능한 제안 한 문장
   - 없으면 빈 문자열 ""

## 규칙
- JSON만 반환 (마크다운, 코드블록, 설명 금지)
- "refined"는 **반드시 개선된 버전** - 복사 절대 금지!
- 출력 언어는 입력 언어와 동일
- 창의적으로 다듬되 원래 의미는 보존`,
};

// Detect language
function detectLanguage(text: string): "en" | "ko" {
  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;
  return koreanRegex.test(text) ? "ko" : "en";
}

// Clean JSON response
function cleanJsonResponse(text: string): string {
  let cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  cleaned = cleaned.trim();
  return cleaned;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required" });
    }

    const language = detectLanguage(text);
    console.log("[REFINE] Detected language:", language);
    console.log("[REFINE] Input text:", text.substring(0, 100));

    const groqApiKey = process.env.GROQ_API_KEY;
    console.log("[REFINE] GROQ_API_KEY exists:", !!groqApiKey);

    if (!groqApiKey) {
      console.error("[REFINE] GROQ_API_KEY not configured!");
      throw new Error("GROQ_API_KEY not configured");
    }

    // ✅ FIX 1: Initialize with higher temperature for creative refinement
    const llm = new ChatGroq({
      apiKey: groqApiKey,
      modelName: "llama-3.3-70b-versatile",
      temperature: 0.6,  // ✅ Increased from 0.3 to 0.6
      maxTokens: 1024,
    });
    console.log("[REFINE] ChatGroq initialized with temperature 0.6");

    // ✅ FIX 2: Use proper message structure (SystemMessage + HumanMessage)
    const systemPrompt = SYSTEM_PROMPTS[language];
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(`입력 텍스트:\n${text}`)  // Clear separation
    ];

    let response;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        console.log(`[REFINE] Attempt ${attempts + 1}/${maxAttempts}`);

        // ✅ FIX 3: Invoke with message array
        response = await llm.invoke(messages);
        const content = response.content as string;

        console.log("[REFINE] Raw LLM response:", content.substring(0, 200));

        const cleanedJson = cleanJsonResponse(content);
        console.log("[REFINE] Cleaned JSON:", cleanedJson.substring(0, 200));

        // Parse and validate
        const parsed = JSON.parse(cleanedJson);
        const validated = RefinedMemoSchema.parse(parsed);

        // ✅ FIX 4: Additional validation - check if refined is actually different
        const originalLower = text.trim().toLowerCase().replace(/\s+/g, ' ');
        const refinedLower = validated.refined.trim().toLowerCase().replace(/\s+/g, ' ');

        // Check similarity (should be significantly different)
        if (originalLower === refinedLower) {
          throw new Error("Refined text is identical to original - LLM did not refine");
        }

        console.log("[REFINE] Validation successful");
        console.log("[REFINE] Original:", text.substring(0, 50));
        console.log("[REFINE] Refined:", validated.refined.substring(0, 50));

        const normalizedContext = normalizeContext(validated.context);

        return res.status(200).json({
          ...validated,
          context: normalizedContext,
          insight: validated.insight ?? "",
          language,
          original_text: text,
          isFallback: false,
        });
      } catch (error) {
        attempts++;
        console.error(`[REFINE] Attempt ${attempts}/${maxAttempts} failed:`, error);

        if (error instanceof Error) {
          console.error(`[REFINE] Error message:`, error.message);
        }

        if (attempts >= maxAttempts) {
          // All attempts failed - return fallback
          console.error("[REFINE] All refinement attempts failed, using fallback");

          const fallbackTag = language === "ko" ? "#메모" : "#memo";

          return res.status(200).json({
            refined: text.slice(0, 1000),
            tag: fallbackTag,
            context: FALLBACK_CONTEXT,
            insight: "",
            language,
            original_text: text,
            isFallback: true,
          });
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error("[REFINE] Fatal error:", error);
    return res.status(500).json({
      error: "Failed to refine memo",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

