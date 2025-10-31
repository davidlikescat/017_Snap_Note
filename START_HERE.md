# 🚀 MIND NOTE - 시작하기

## ✅ 코딩 완료!

모든 핵심 기능이 구현되었습니다:
- ✅ 음성 녹음 + Web Speech API
- ✅ AI 정제 (LangChain + Groq)
- ✅ 데이터베이스 CRUD
- ✅ 검색 및 필터링
- ✅ 이중 언어 (영어/한국어)

---

## 📦 설치 및 실행 (5분)

### 1단계: 의존성 설치

```bash
cd frontend
npm install
```

### 2단계: 환경 변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 파일 편집:
```bash
# Supabase (무료 가입: https://supabase.com)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Groq API (무료 가입: https://console.groq.com)
VITE_GROQ_API_KEY=gsk_your-key-here
```

### 3단계: Supabase 데이터베이스 설정

1. [Supabase](https://supabase.com)에 로그인
2. 새 프로젝트 생성
3. SQL Editor 열기
4. `supabase/migrations/001_create_memos_table.sql` 내용 복사
5. "Run" 클릭

### 4단계: 개발 서버 시작!

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기 🎉

---

## 🧪 테스트 방법

### 1. 텍스트 입력 테스트
1. "Write Text" 클릭
2. 테스트 메모 입력: "I had a great idea for a new app today"
3. "Refine with AI" 클릭
4. AI 정제 결과 확인
5. "Save Memo" 클릭

### 2. 음성 녹음 테스트
1. "Record Voice" 클릭
2. 마이크 권한 허용
3. 마이크 버튼 클릭하고 말하기
4. 실시간 자막 확인
5. Stop 버튼 → AI 정제 → 저장

### 3. 검색 및 필터 테스트
1. "View All Memos" 클릭
2. 저장된 메모 확인
3. 검색어 입력
4. 필터 버튼 → 태그/컨텍스트 필터링

---

## 🔑 API 키 받기

### Groq API (무료)
1. https://console.groq.com 방문
2. 이메일로 가입
3. "Create API Key" 클릭
4. 키 복사 (gsk_로 시작)
5. `.env.local`에 붙여넣기

**무료 한도**: 14,400 요청/일 (충분!)

### Supabase (무료)
1. https://supabase.com 방문
2. GitHub로 로그인
3. "New Project" 클릭
4. Settings → API → 키 복사
   - Project URL
   - `anon` public key

---

## 🐛 문제 해결

### "Microphone permission denied"
→ 브라우저 설정에서 마이크 권한 허용

### "GROQ_API_KEY not configured"
→ `.env.local` 파일 확인, `VITE_GROQ_API_KEY` 변수명 정확히 입력

### "Failed to fetch memos"
→ Supabase URL과 키 확인
→ SQL 마이그레이션 실행 확인

### "Web Speech API not supported"
→ Chrome, Edge, Safari 사용 (Firefox는 제한적)

---

## 📱 모바일에서 테스트

### 같은 Wi-Fi에서:
```bash
# 내 IP 확인 (Mac/Linux)
ifconfig | grep "inet "

# 모바일 브라우저에서 접속
http://192.168.x.x:3000
```

### PWA 설치:
- iOS Safari: Share → "Add to Home Screen"
- Android Chrome: Menu → "Install App"

---

## 🎯 다음 단계

### 지금 가능한 것:
- ✅ 음성 녹음 및 실시간 자막
- ✅ 텍스트 입력
- ✅ AI 자동 정제 (무료!)
- ✅ 태그 및 카테고리 자동 분류
- ✅ 검색 및 필터링
- ✅ 영어/한국어 자동 감지

### 추가 구현 필요 (선택):
- [ ] API 서버 배포 (Vercel)
- [ ] PWA 아이콘 생성
- [ ] 사용자 인증 (Supabase Auth)
- [ ] Export 기능 (CSV, Notion)

---

## 📚 문서

- [README.md](./README.md) - 프로젝트 개요
- [QUICKSTART.md](./QUICKSTART.md) - 5분 셋업
- [docs/SETUP.md](./docs/SETUP.md) - 상세 가이드
- [docs/FREE_TIER_GUIDE.md](./docs/FREE_TIER_GUIDE.md) - 비용 최적화
- [docs/LANGCHAIN_USAGE.md](./docs/LANGCHAIN_USAGE.md) - LangChain 가이드

---

## 🎉 축하합니다!

**완전히 작동하는 AI 메모 시스템이 준비되었습니다!**

### 구현된 기능:
- 🎙️ 음성 녹음 (MediaRecorder API)
- 🗣️ 실시간 자막 (Web Speech API)
- 🤖 AI 정제 (LangChain + Groq)
- 💾 데이터베이스 (Supabase)
- 🔍 검색 및 필터
- 🌐 이중 언어 (영어/한국어)
- 📱 반응형 디자인

### 비용: $0/월
- Groq: 무료 (14,400 req/day)
- Supabase: 무료 (500MB)
- Vercel: 무료 (100GB 대역폭)

---

## 🚀 시작하세요!

```bash
cd frontend
npm install
npm run dev
```

**Happy Memo-ing!** 📝✨
