import { MemoContext } from '@/types/memo';

export const TAG_CATEGORIES = {
  IDEAS: {
    en: ['#idea', '#inspiration', '#concept', '#brainstorm', '#innovation'],
    ko: ['#아이디어', '#발상', '#영감', '#기획', '#컨셉']
  },
  LEARNING: {
    en: ['#learning', '#notes', '#insight', '#coaching', '#education'],
    ko: ['#학습', '#독서노트', '#강의메모', '#인사이트', '#코칭']
  },
  REFLECTION: {
    en: ['#emotion', '#reflection', '#gratitude', '#memory', '#diary'],
    ko: ['#감정', '#자기성찰', '#감사', '#회상', '#일기']
  },
  PEOPLE: {
    en: ['#people', '#conversation', '#observation', '#feedback', '#relationship'],
    ko: ['#사람', '#대화기록', '#관찰', '#피드백', '#인간관계']
  },
  BUSINESS: {
    en: ['#work', '#project', '#marketing', '#strategy', '#meeting'],
    ko: ['#업무메모', '#프로젝트', '#마케팅', '#전략', '#회의']
  },
  PHILOSOPHY: {
    en: ['#philosophy', '#values', '#mindset', '#belief', '#principle'],
    ko: ['#철학', '#가치관', '#삶의태도', '#신념', '#원칙']
  },
  CREATIVE: {
    en: ['#writing', '#content', '#story', '#creative', '#art'],
    ko: ['#글쓰기', '#콘텐츠아이디어', '#스토리', '#창작', '#예술']
  },
  GOALS: {
    en: ['#vision', '#goals', '#future', '#habits', '#planning'],
    ko: ['#비전', '#목표', '#미래계획', '#습관', '#계획']
  }
} as const;

export const CONTEXT_TYPES: Record<MemoContext, { en: string; ko: string }> = {
  'Idea': { en: 'Idea', ko: '아이디어' },
  'Idea Development': { en: 'Idea Development', ko: '아이디어 구체화' },
  'Work Memo': { en: 'Work Memo', ko: '업무메모' },
  'Work Log': { en: 'Work Log', ko: '업무 기록' },
  'Meeting Notes': { en: 'Meeting Notes', ko: '회의기록' },
  'Teaching Idea': { en: 'Teaching Idea', ko: '교육아이디어' },
  'Coaching Note': { en: 'Coaching Note', ko: '코칭노트' },
  'Personal Reflection': { en: 'Personal Reflection', ko: '개인성찰' },
  'Learning Memo': { en: 'Learning Memo', ko: '학습 메모' },
  'Relationship Notes': { en: 'Relationship Notes', ko: '관계 정리' },
  'Emotion Exploration': { en: 'Emotion Exploration', ko: '감정 탐색' },
  'Goal Check': { en: 'Goal Check', ko: '목표 점검' },
  'Feedback Review': { en: 'Feedback Review', ko: '피드백 정리' },
  'Memory Log': { en: 'Memory Log', ko: '회상기록' },
  'Observation Note': { en: 'Observation Note', ko: '관찰노트' },
  'Inspiration': { en: 'Inspiration', ko: '영감수집' },
  'Philosophy Memo': { en: 'Philosophy Memo', ko: '철학메모' },
  'Content Idea': { en: 'Content Idea', ko: '콘텐츠아이디어' },
  'Story Note': { en: 'Story Note', ko: '스토리노트' },
  'Goal Setting': { en: 'Goal Setting', ko: '목표설정' },
  'Habit Log': { en: 'Habit Log', ko: '습관기록' },
  'Memory Archive': { en: 'Memory Archive', ko: '기억보관' }
};

export const ALL_TAGS = {
  en: Object.values(TAG_CATEGORIES).flatMap(cat => cat.en),
  ko: Object.values(TAG_CATEGORIES).flatMap(cat => cat.ko)
};

export const APP_CONFIG = {
  MAX_AUDIO_DURATION: Number(import.meta.env.VITE_MAX_AUDIO_DURATION) || 300000, // 5 minutes
  MAX_TEXT_LENGTH: Number(import.meta.env.VITE_MAX_TEXT_LENGTH) || 500,
  MAX_TAGS: 3,
  MIN_TAGS: 1,
  SUPPORTED_LANGUAGES: ['en', 'ko'] as const
} as const;

export const API_ENDPOINTS = {
  REFINE: '/api/refine',
  MEMO: '/api/memo',
  SEARCH: '/api/search'
} as const;

export const STORAGE_KEYS = {
  DRAFT_TEXT: 'mind-note-draft-text',
  DRAFT_AUDIO: 'mind-note-draft-audio',
  PREFERRED_LANGUAGE: 'mind-note-language'
} as const;
