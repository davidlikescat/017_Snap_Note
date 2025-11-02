import { ChatGroq } from "@langchain/groq";
import { z } from "zod";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Zod schema for validation
const RefinedMemoSchema = z.object({
  refined: z.string().max(1000), // summary -> refined, 길이 증가
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

// System prompts for English and Korean
const SYSTEM_PROMPTS = {
  en: `You are MIND AGENT, an AI assistant that transforms raw voice/text memos into polished, professional notes.

## Your Mission
Transform casual, spoken memos into clear, well-structured written text while preserving ALL original meaning.

## Critical Instructions for "refined" Field

INPUT: "Go to detect the Detector"
WRONG OUTPUT: "Go to detect the Detector" ❌ (This is just copying!)
CORRECT OUTPUT: "Navigate to the Detector system and verify its operational status" ✅

INPUT: "test msg for me"
WRONG OUTPUT: "test msg for me" ❌ (No refinement at all!)
CORRECT OUTPUT: "This is a test message for personal verification" ✅

### What "Refined" Means:
1. **Expand abbreviations**: "msg" → "message", "info" → "information"
2. **Complete incomplete thoughts**: Add context and clarity
3. **Fix grammar**: Proper capitalization, punctuation, complete sentences
4. **Enhance readability**: Transform spoken fragments into flowing prose
5. **Maintain meaning**: Don't change what the user meant, just make it clearer
6. **Professional tone**: Convert casual speech to polished written language

### Examples:

**Example 1:**
Input: "told to god and then"
Bad: "told to god and then" ❌
Good: "Shared the information with the appropriate authority and proceeded with the next steps" ✅

**Example 2:**
Input: "need buy milk bread eggs tmrw"
Bad: "need buy milk bread eggs tmrw" ❌
Good: "Tomorrow's shopping list: milk, bread, and eggs" ✅

**Example 3:**
Input: "meeting went ok, discussed project timeline budget concerns"
Bad: "meeting went ok, discussed project timeline budget concerns" ❌
Good: "The meeting proceeded smoothly. We discussed the project timeline and addressed budget-related concerns." ✅

## Output Format (4 required fields)

1. **refined**: Transform the raw text into polished, professional written form
   - Must be SIGNIFICANTLY different from original
   - Complete all sentences properly
   - Expand all abbreviations
   - Add appropriate punctuation and capitalization
   - Make it sound like a professional note, not casual speech

2. **tag**: Choose ONE most semantically relevant tag with # prefix
   #work-log #meeting-memo #idea #self-reflection #emotion-log #relationships #habits #goals #feedback #decision #learning-notes #planning #experiment #review #daily-log
   (You can create new tags if needed - use the same language as input)

3. **context**: Choose exactly ONE most appropriate usage context
   Options: Personal Reflection / Work Log / Idea Development / Learning Memo / Relationship Notes / Emotion Exploration / Goal Check / Feedback Review

4. **insight**: (optional) One-sentence actionable suggestion
   Example: "Consider scheduling a follow-up meeting to finalize the budget."

## Output Format (JSON ONLY)
{
  "refined": "Professionally polished version - MUST be significantly enhanced from original",
  "tag": "#single-tag",
  "context": "Context Type",
  "insight": "Optional actionable suggestion or empty string"
}

## Rules
- Return ONLY valid JSON (no markdown, code blocks, or explanations)
- "refined" MUST be noticeably better than the original - not a copy!
- Create new tags if needed - match input language
- Context must be exactly 1 from the list
- Output language must match input language

## Input Text
`,
  ko: `너는 음성/텍스트 메모를 전문적인 문서로 변환하는 AI 비서 MIND AGENT다.

## 핵심 임무
구어체 메모를 명확하고 세련된 문어체로 변환하되, 원래 의미는 모두 보존한다.

## "refined" 필드 작성법 - 매우 중요!

입력: "go to detect the Detector"
잘못된 출력: "Go to detect the Detector" ❌ (그냥 복사!)
올바른 출력: "디텍터 시스템으로 이동하여 작동 상태를 확인하라" ✅

입력: "test msg for me"
잘못된 출력: "test msg for me" ❌ (정제 안 함!)
올바른 출력: "개인 확인용 테스트 메시지입니다" ✅

### "Refined"의 의미:
1. **약어 풀어쓰기**: "msg" → "메시지", "info" → "정보"
2. **불완전한 문장 완성**: 맥락을 추가하여 명확하게 만들기
3. **문법 교정**: 올바른 맞춤법, 띄어쓰기, 문장부호
4. **가독성 향상**: 구어체 조각을 자연스러운 문어체로
5. **의미 유지**: 사용자의 의도를 바꾸지 말고 더 명확하게만 표현
6. **전문적인 톤**: 일상 대화체를 격식있는 문서체로

### 예시:

**예시 1:**
입력: "회의 괜찮았음 프로젝트 일정이랑 예산 얘기함"
나쁜 출력: "회의 괜찮았음 프로젝트 일정이랑 예산 얘기함" ❌
좋은 출력: "회의가 원활하게 진행되었습니다. 프로젝트 일정과 예산 관련 사항을 논의했습니다." ✅

**예시 2:**
입력: "내일 우유 빵 계란 사야됨"
나쁜 출력: "내일 우유 빵 계란 사야됨" ❌
좋은 출력: "내일 장보기: 우유, 빵, 계란" ✅

**예시 3:**
입력: "클라이언트한테 연락해서 그거 확인받아야함"
나쁜 출력: "클라이언트한테 연락해서 그거 확인받아야함" ❌
좋은 출력: "클라이언트에게 연락하여 해당 사항에 대한 승인을 받아야 합니다." ✅

## 출력 형식 (4가지 필수)

1. **refined**: 원문을 전문적이고 세련된 문어체로 변환
   - 원문과 **확연히 달라야 함** (단순 복사 금지)
   - 모든 문장을 완전하게 완성
   - 약어를 모두 풀어쓰기
   - 적절한 문장부호와 맞춤법 적용
   - 격식있는 문서처럼 들리게 작성

2. **tag**: 의미상 가장 적합한 태그 1개만 선택 (# 접두사)
   #업무기록 #회의메모 #아이디어 #자기성찰 #감정기록 #관계 #습관 #목표 #피드백 #결정 #학습노트 #기획 #실험 #리뷰 #일상기록
   (필요시 새 태그 생성 가능 - 입력 언어와 동일하게)

3. **context**: 가장 적합한 맥락 **딱 1개만** 선택
   옵션: 개인 회고 / 업무 기록 / 아이디어 구체화 / 학습 메모 / 관계 정리 / 감정 탐색 / 목표 점검 / 피드백 정리

4. **insight**: (선택) 실행 가능한 제안 한 문장
   예시: "다음 회의에서 예산 확정을 위한 팔로업 일정을 잡으세요."

## 출력 형식 (JSON만 출력)
{
  "refined": "전문적으로 다듬어진 버전 - 원문과 확연히 달라야 함",
  "tag": "#태그1개",
  "context": "맥락",
  "insight": "실행 가능한 제안 또는 빈 문자열"
}

## 규칙
- 반드시 JSON만 반환 (마크다운, 코드블록, 설명 금지)
- "refined"는 원문보다 **눈에 띄게 개선**되어야 함 - 복사 금지!
- 필요시 새 태그 생성 - 입력 언어와 일치
- context는 위 목록에서 1개만
- 출력 언어는 입력 언어와 동일

## 입력 텍스트
`,
};

// Detect language - 한국어만 감지, 나머지는 영어 프롬프트 사용 (LLM이 입력 언어에 맞춰 출력)
function detectLanguage(text: string): "en" | "ko" {
  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;
  return koreanRegex.test(text) ? "ko" : "en";
}

// Clean JSON response from LLM
function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  // Remove leading/trailing whitespace
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

    // Detect language (한국어인지만 확인, 나머지는 영어 프롬프트 사용)
    const language = detectLanguage(text);
    console.log("[REFINE] Detected language:", language);
    console.log("[REFINE] Text length:", text.length);

    // Initialize Groq LLM with LangChain
    const groqApiKey = process.env.GROQ_API_KEY;
    console.log("[REFINE] GROQ_API_KEY exists:", !!groqApiKey);
    console.log("[REFINE] GROQ_API_KEY length:", groqApiKey?.length || 0);

    if (!groqApiKey) {
      console.error("[REFINE] GROQ_API_KEY not configured!");
      throw new Error("GROQ_API_KEY not configured");
    }

    const llm = new ChatGroq({
      apiKey: groqApiKey,
      modelName: "llama-3.3-70b-versatile", // Updated model (llama-3.1 decommissioned)
      temperature: 0.3, // Lower temperature for more consistent JSON output
      maxTokens: 1024,
    });
    console.log("[REFINE] ChatGroq initialized successfully");

    // Construct prompt
    const systemPrompt = SYSTEM_PROMPTS[language];
    const fullPrompt = systemPrompt + text;

    // Call LLM (with retry logic)
    let response;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        response = await llm.invoke(fullPrompt);
        const content = response.content as string;
        const cleanedJson = cleanJsonResponse(content);

        // Parse and validate JSON
        const parsed = JSON.parse(cleanedJson);
        const validated = RefinedMemoSchema.parse(parsed);

        // Success! Return result
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
        console.error(`[REFINE] Error type:`, error instanceof Error ? error.constructor.name : typeof error);
        console.error(`[REFINE] Error message:`, error instanceof Error ? error.message : String(error));
        if (error instanceof Error && error.stack) {
          console.error(`[REFINE] Stack trace:`, error.stack.split('\n').slice(0, 3).join('\n'));
        }

        if (attempts >= maxAttempts) {
          // All attempts failed - return fallback
          console.error("[REFINE] All refinement attempts failed, using fallback");
          console.error("[REFINE] GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY);
          console.error("[REFINE] GROQ_API_KEY length:", process.env.GROQ_API_KEY?.length || 0);

          const fallbackTag = language === "ko" ? "#메모" : "#memo";

          return res.status(200).json({
            refined: text.slice(0, 1000), // summary -> refined
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
    console.error("Refinement error:", error);
    return res.status(500).json({
      error: "Failed to refine memo",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
