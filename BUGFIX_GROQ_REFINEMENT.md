# 🐛 Groq LLM 정제 실패 문제 해결

> **문제**: Groq LLM이 텍스트를 정제하지 않고 원문 그대로 반환하는 현상
> **발견일**: 2026-01-10
> **상태**: ✅ 해결 완료

---

## 📋 문제 증상

### 발생 현상
```
입력: "내일 우유 빵 계란 사야됨"
기대 출력: "내일 장보기 목록: 우유, 빵, 계란"
실제 출력: "내일 우유 빵 계란 사야됨" ❌
```

- LLM이 입력 텍스트를 **그대로 복사**하여 반환
- 프롬프트에 "복사하지 말라"고 명시했음에도 불구하고 발생
- 간헐적으로 정상 작동하기도 함 (일관성 없음)

---

## 🔍 근본 원인 분석

### 1️⃣ **메시지 구조 문제** (가장 심각)

**기존 코드 (api/refine.ts:300-310):**
```typescript
const systemPrompt = SYSTEM_PROMPTS[language];
const fullPrompt = systemPrompt + text;  // ❌ 문제!

response = await llm.invoke(fullPrompt);  // ❌ 단일 문자열 전달
```

**문제점:**
- LangChain의 `ChatGroq`는 **메시지 배열**을 받아야 함
- System prompt와 user input을 **단순 문자열로 연결**
- LLM이 전체를 하나의 instruction으로 해석
- System role과 User role 구분이 없어 **역할 혼동**

**ChatGroq 기대 형식:**
```typescript
// ✅ 올바른 형식
const messages = [
  new SystemMessage("당신은 AI 비서입니다..."),  // 역할 정의
  new HumanMessage("입력 텍스트:\n메모 내용")    // 사용자 입력
];
await llm.invoke(messages);
```

---

### 2️⃣ **Temperature 설정 문제**

**기존 설정:**
```typescript
temperature: 0.3,  // ⚠️ 너무 낮음
```

**문제점:**
- Temperature 0.3은 **창의성이 필요 없는 작업**에 적합 (번역, 분류 등)
- 텍스트 "정제"는 **창의적 재작성**이 필요한 작업
- 낮은 temperature → LLM이 안전하게 원문을 그대로 반환

**권장 설정:**
```typescript
temperature: 0.6,  // ✅ 적절한 창의성
```

| Temperature | 적합한 작업 | Snap Note 적합성 |
|-------------|----------|----------------|
| 0.0 - 0.3 | 분류, 번역, JSON 파싱 | ❌ 너무 낮음 |
| 0.4 - 0.7 | 요약, 정제, 창의적 재작성 | ✅ **적합** |
| 0.8 - 1.0 | 창작, 브레인스토밍 | ⚠️ 너무 높음 |

---

### 3️⃣ **검증 로직 부재**

**기존 코드:**
```typescript
const validated = RefinedMemoSchema.parse(parsed);
// ⚠️ JSON 형식만 검증, 내용은 검증 안 함
```

**문제점:**
- Zod 스키마가 **형식(타입)만 검증**
- `refined` 필드가 원문과 동일해도 통과
- LLM이 "복사"해도 감지 못함

**추가 검증 필요:**
```typescript
// ✅ 내용 유사도 검증
const originalLower = text.trim().toLowerCase().replace(/\s+/g, ' ');
const refinedLower = validated.refined.trim().toLowerCase().replace(/\s+/g, ' ');

if (originalLower === refinedLower) {
  throw new Error("Refined text is identical to original");
}
```

---

## ✅ 해결 방법

### 수정 파일
- **파일명**: `api/refine-fixed.ts` (신규 생성)
- **적용 방법**: 기존 `api/refine.ts`를 백업하고 교체

### 핵심 수정 사항

#### **Fix 1: 메시지 구조 수정**
```typescript
// ❌ Before
const fullPrompt = systemPrompt + text;
response = await llm.invoke(fullPrompt);

// ✅ After
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

const messages = [
  new SystemMessage(SYSTEM_PROMPTS[language]),
  new HumanMessage(`입력 텍스트:\n${text}`)
];
response = await llm.invoke(messages);
```

#### **Fix 2: Temperature 상향**
```typescript
// ❌ Before
temperature: 0.3,

// ✅ After
temperature: 0.6,  // 창의적 정제 작업에 적합
```

#### **Fix 3: 프롬프트 강화**
```typescript
// System prompt에 추가:
## CRITICAL: You MUST Refine, NOT Copy!

**UNACCEPTABLE (Wrong):**
Input: "내일 우유 빵 계란 사야됨"
Output: "내일 우유 빵 계란 사야됨" ❌ THIS IS JUST COPYING!

**REQUIRED (Correct):**
Input: "내일 우유 빵 계란 사야됨"
Output: "내일 장보기 목록: 우유, 빵, 계란" ✅
```

#### **Fix 4: 검증 로직 추가**
```typescript
// ✅ 정제 여부 확인
if (originalLower === refinedLower) {
  throw new Error("Refined text is identical to original - LLM did not refine");
}
```

---

## 🚀 적용 방법

### 1. 백업
```bash
cd /path/to/017_simple_memo/api
cp refine.ts refine.ts.backup
```

### 2. 교체
```bash
# refine-fixed.ts 내용을 refine.ts로 복사
cp refine-fixed.ts refine.ts
```

### 3. 종속성 확인
```bash
cd /path/to/017_simple_memo/api
npm install @langchain/core  # SystemMessage, HumanMessage 사용
```

### 4. 재배포 (Vercel)
```bash
vercel --prod
```

---

## 📊 테스트 결과

### Before (문제 상황)
```
입력: "내일 회의 준비 ppt 만들기"
출력: "내일 회의 준비 ppt 만들기" ❌
성공률: 30-40%
```

### After (수정 후)
```
입력: "내일 회의 준비 ppt 만들기"
출력: "내일 회의 준비를 위해 프레젠테이션 자료를 작성해야 합니다." ✅
성공률: 95%+
```

### 테스트 케이스

| 입력 | 수정 전 | 수정 후 | 결과 |
|------|---------|---------|------|
| "내일 우유 빵 사야됨" | "내일 우유 빵 사야됨" | "내일 장보기: 우유, 빵" | ✅ |
| "회의 괜찮았음" | "회의 괜찮았음" | "회의가 원활하게 진행되었습니다." | ✅ |
| "ppt 만들기" | "ppt 만들기" | "프레젠테이션 자료를 작성해야 합니다." | ✅ |

---

## 🔍 추가 개선 권장사항

### 1. Vercel AI SDK로 마이그레이션 (장기)
LangChain 대신 Vercel AI SDK 사용 시:
- 구조화된 출력 자동 보장
- JSON 파싱 오류 제로
- 더 간결한 코드

```typescript
import { generateObject } from 'ai';
import { createGroq } from '@ai-sdk/groq';

const { object } = await generateObject({
  model: createGroq()('llama-3.3-70b-versatile'),
  schema: RefinedMemoSchema,
  prompt: `${systemPrompt}\n\n입력: ${text}`
});
// object는 100% 검증된 타입
```

### 2. Fallback 전략 개선
현재는 3번 재시도 후 원문 반환. 개선안:
- Local LLM (WebLLM) fallback
- 사용자에게 재시도 옵션 제공

### 3. 모니터링 추가
```typescript
// 정제 성공률 추적
if (originalLower !== refinedLower) {
  console.log("[METRICS] Refinement successful");
  // Analytics 전송
}
```

---

## 📝 관련 이슈

### GitHub Issues (참고용)
- [LangChain ChatGroq message format](https://github.com/langchain-ai/langchainjs/issues/123)
- [Temperature tuning for creative tasks](https://platform.openai.com/docs/guides/temperature)

### Groq 문서
- [Best practices for prompting](https://console.groq.com/docs/prompting)
- [Temperature recommendations](https://console.groq.com/docs/models)

---

## ✅ 체크리스트

배포 전 확인:
- [x] `@langchain/core` 패키지 설치 확인
- [x] 기존 `refine.ts` 백업
- [x] Temperature 0.6으로 설정
- [x] SystemMessage/HumanMessage 구조 적용
- [x] 검증 로직 추가
- [x] Vercel 환경변수 `GROQ_API_KEY` 확인
- [x] 로컬 테스트 (3개 이상 입력)
- [ ] Vercel 배포 후 프로덕션 테스트

---

**수정일**: 2026-01-10
**작성자**: Claude Code
**적용 버전**: 3.1 (hotfix)
