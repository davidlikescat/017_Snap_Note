# 🚀 Migration Guide - MIND NOTE 전체 정리

이 가이드는 MIND NOTE 프로젝트의 주요 이슈들을 해결한 내용을 정리합니다.

---

## 📋 해결된 이슈 목록

### 🔴 심각한 이슈 (Critical)

1. ✅ **데이터 모델 불일치** - DB `summary` → `refined` 통일
2. ✅ **Groq API 키 노출** - 프론트 직접 호출 → `/api/refine` 경유
3. ✅ **권한 정책 부재** - RLS 완전 공개 → Session 기반 접근 제어

### 🟡 중간 이슈 (Medium)

4. ✅ **언어 제약 미스매치** - DB CHECK 확장 (en/ko → en/ko/ja/es/fr/de)
5. ✅ **컨텍스트 값 불일치** - Fallback 컨텍스트 영어로 통일
6. ✅ **한국어 검색 품질** - 다국어 search_vector 지원

---

## 🎯 적용 방법

### 1️⃣ DB 마이그레이션 실행

**Supabase Dashboard에서 다음 SQL 파일들을 순서대로 실행하세요:**

#### Step 1: 메인 마이그레이션
파일: `supabase/migrations/002_update_to_refined.sql`

```sql
-- summary → refined 컬럼 변경
-- 언어 제약 확장 (en/ko → en/ko/ja/es/fr/de)
-- 다국어 검색 지원 (한글/일본어는 simple, 나머지는 english)
-- refined 최대 길이 확장 (500 → 1000자)
```

#### Step 2: RLS 개선 (선택사항)
파일: `supabase/migrations/003_add_session_based_access.sql`

```sql
-- session_id 컬럼 추가
-- Session 기반 RLS 정책 생성
-- 사용자 간 데이터 격리
```

**실행 방법:**
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택 (ygaogkvclceabyxergkv)
3. **SQL Editor** 메뉴
4. 파일 내용 복사 → 붙여넣기 → **Run** 버튼 클릭

---

### 2️⃣ 프론트엔드 변경사항 (자동 적용됨)

#### 변경된 파일들:

1. **`frontend/src/hooks/useRefine.ts`**
   - ❌ 제거: 직접 Groq API 호출
   - ✅ 추가: `/api/refine` 백엔드 API 호출
   - ✅ 수정: Fallback 컨텍스트 영어로 통일

2. **`frontend/src/lib/supabase.ts`**
   - ✅ 타입 정의: `summary` → `refined`

3. **`frontend/src/types/memo.ts`**
   - ✅ 모든 인터페이스: `summary` → `refined`

4. **`frontend/src/hooks/useMemo.ts`**
   - ✅ DB 쿼리: `summary` → `refined`

5. **`frontend/src/pages/*.tsx`**
   - ✅ 모든 페이지: `summary` → `refined` 통일

6. **`frontend/src/pages/Write.tsx`, `Result.tsx`**
   - ✅ 추가: 실시간 진행 상태 UI (5단계 프로그레스 바)

---

### 3️⃣ 백엔드 확인사항

**`api/refine.ts`는 이미 올바르게 구현되어 있습니다:**

```typescript
// ✅ Groq API Key는 서버에만 존재
// ✅ Zod 스키마 검증
// ✅ refined 필드 사용
// ✅ 다국어 프롬프트 (en/ko)
// ✅ 입력 언어 = 출력 언어
```

---

## 📊 변경 사항 요약

### 데이터베이스

| 항목 | 이전 | 이후 |
|------|------|------|
| 메인 컬럼 | `summary TEXT(500)` | `refined TEXT(1000)` |
| 언어 지원 | `en`, `ko` | `en`, `ko`, `ja`, `es`, `fr`, `de` |
| 검색 색인 | English only | 다국어 (simple/english) |
| RLS 정책 | 완전 공개 | Session 기반 격리 |

### 프론트엔드

| 항목 | 이전 | 이후 |
|------|------|------|
| API 호출 | `fetch('https://api.groq.com/...')` | `fetch('/api/refine')` |
| API Key | 브라우저 노출 | 서버에만 존재 |
| 필드명 | `summary` | `refined` |
| 진행 UI | 없음 | 5단계 프로그레스 바 |
| Fallback | 한글 컨텍스트 | 영어 컨텍스트 |

### 보안

| 항목 | 이전 | 이후 |
|------|------|------|
| Groq API Key | ⚠️ 클라이언트 노출 | ✅ 서버 전용 |
| 데이터 접근 | ⚠️ 누구나 CRUD | ✅ Session 격리 |
| RLS | ⚠️ 완전 공개 | ✅ 세션별 제한 |

---

## 🧪 테스트 방법

### 1. DB 마이그레이션 확인

```sql
-- Supabase SQL Editor에서 실행
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'memos' AND column_name = 'refined';

-- 결과: refined | text | 1000
```

### 2. 프론트엔드 테스트

1. **Write 페이지** (http://localhost:3001/write)
   - 텍스트 입력
   - "AI로 정제" 버튼 클릭
   - ✅ 5단계 진행 상태 표시 확인
   - ✅ Result 페이지로 이동 확인

2. **브라우저 콘솔 확인**
   ```
   🔍 [DEBUG] Starting AI refinement...
   🚀 [DEBUG] Calling /api/refine...
   ✅ [DEBUG] API call successful!
   🎉 [DEBUG] AI refinement successful!
   ```

3. **Network 탭 확인**
   - `POST /api/refine` 호출 확인
   - ❌ `https://api.groq.com` 직접 호출 없어야 함

### 3. 데이터 저장 확인

```sql
-- Supabase SQL Editor에서 실행
SELECT id, refined, tags, context, language, session_id, created_at
FROM memos
ORDER BY created_at DESC
LIMIT 5;
```

---

## ⚠️ 주의사항

### 1. Session-based RLS 제한사항

**현재 구현:**
- localStorage에 session_id 저장
- 각 사용자는 자신의 session_id로 격리됨

**한계:**
- ⚠️ Session ID를 아는 사람은 데이터 접근 가능
- ⚠️ 완전한 보안이 아님 (MVP 용도)

**향후 개선:**
```sql
-- TODO: Supabase Auth 도입 후
ALTER TABLE memos ADD COLUMN user_id UUID REFERENCES auth.users(id);
-- RLS 정책을 auth.uid() 기반으로 변경
```

### 2. 기존 데이터 마이그레이션

**기존에 저장된 데이터가 있다면:**
- `summary` → `refined` 컬럼명 변경만 수행
- 데이터는 보존됨
- `session_id`가 NULL인 레거시 데이터는 모든 세션에서 접근 가능

### 3. API Rate Limiting

**Groq API 무료 티어:**
- 분당 30 requests
- 일일 14,400 requests

**현재는 클라이언트 수만큼 제한이 분산됨**
- 향후 백엔드에서 rate limiting 구현 필요

---

## 🎉 완료!

모든 수정 사항이 적용되었습니다. 이제 다음을 실행하세요:

1. ✅ Supabase에서 마이그레이션 SQL 실행
2. ✅ 브라우저 새로고침
3. ✅ 텍스트 입력 → AI 정제 → 저장 테스트

**문제가 있다면 브라우저 콘솔 로그를 확인하세요!**

---

## 📚 추가 참고

- **Groq API 문서**: https://console.groq.com/docs
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **LangChain JS**: https://js.langchain.com/docs/

---

**마지막 업데이트:** 2025-10-31
**작성자:** Claude AI Assistant
