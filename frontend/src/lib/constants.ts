import { MemoContext } from '@/types/memo';

export const TAG_CATEGORIES = {
  IDEAS: {
    en: ['#idea', '#inspiration', '#concept', '#brainstorm', '#innovation'],
    ko: ['#아이디어', '#발상', '#영감', '#기획', '#컨셉'],
    ja: ['#アイデア', '#インスピレーション', '#コンセプト', '#ブレスト', '#革新'],
    es: ['#idea', '#inspiración', '#concepto', '#lluvia', '#innovación'],
    fr: ['#idée', '#inspiration', '#concept', '#brainstorm', '#innovation'],
    de: ['#Idee', '#Inspiration', '#Konzept', '#Brainstorm', '#Innovation']
  },
  LEARNING: {
    en: ['#learning', '#notes', '#insight', '#coaching', '#education'],
    ko: ['#학습', '#독서노트', '#강의메모', '#인사이트', '#코칭'],
    ja: ['#学習', '#ノート', '#洞察', '#コーチング', '#教育'],
    es: ['#aprendizaje', '#notas', '#perspicacia', '#coaching', '#educación'],
    fr: ['#apprentissage', '#notes', '#insight', '#coaching', '#éducation'],
    de: ['#Lernen', '#Notizen', '#Einsicht', '#Coaching', '#Bildung']
  },
  REFLECTION: {
    en: ['#emotion', '#reflection', '#gratitude', '#memory', '#diary'],
    ko: ['#감정', '#자기성찰', '#감사', '#회상', '#일기'],
    ja: ['#感情', '#内省', '#感謝', '#思い出', '#日記'],
    es: ['#emoción', '#reflexión', '#gratitud', '#memoria', '#diario'],
    fr: ['#émotion', '#réflexion', '#gratitude', '#mémoire', '#journal'],
    de: ['#Emotion', '#Reflexion', '#Dankbarkeit', '#Erinnerung', '#Tagebuch']
  },
  PEOPLE: {
    en: ['#people', '#conversation', '#observation', '#feedback', '#relationship'],
    ko: ['#사람', '#대화기록', '#관찰', '#피드백', '#인간관계'],
    ja: ['#人', '#会話', '#観察', '#フィードバック', '#関係'],
    es: ['#gente', '#conversación', '#observación', '#feedback', '#relación'],
    fr: ['#gens', '#conversation', '#observation', '#feedback', '#relation'],
    de: ['#Menschen', '#Gespräch', '#Beobachtung', '#Feedback', '#Beziehung']
  },
  BUSINESS: {
    en: ['#work', '#project', '#marketing', '#strategy', '#meeting'],
    ko: ['#업무메모', '#프로젝트', '#마케팅', '#전략', '#회의'],
    ja: ['#仕事', '#プロジェクト', '#マーケティング', '#戦略', '#会議'],
    es: ['#trabajo', '#proyecto', '#marketing', '#estrategia', '#reunión'],
    fr: ['#travail', '#projet', '#marketing', '#stratégie', '#réunion'],
    de: ['#Arbeit', '#Projekt', '#Marketing', '#Strategie', '#Meeting']
  },
  PHILOSOPHY: {
    en: ['#philosophy', '#values', '#mindset', '#belief', '#principle'],
    ko: ['#철학', '#가치관', '#삶의태도', '#신념', '#원칙'],
    ja: ['#哲学', '#価値観', '#マインドセット', '#信念', '#原則'],
    es: ['#filosofía', '#valores', '#mentalidad', '#creencia', '#principio'],
    fr: ['#philosophie', '#valeurs', '#mentalité', '#croyance', '#principe'],
    de: ['#Philosophie', '#Werte', '#Denkweise', '#Glaube', '#Prinzip']
  },
  CREATIVE: {
    en: ['#writing', '#content', '#story', '#creative', '#art'],
    ko: ['#글쓰기', '#콘텐츠아이디어', '#스토리', '#창작', '#예술'],
    ja: ['#執筆', '#コンテンツ', '#ストーリー', '#創作', '#アート'],
    es: ['#escritura', '#contenido', '#historia', '#creativo', '#arte'],
    fr: ['#écriture', '#contenu', '#histoire', '#créatif', '#art'],
    de: ['#Schreiben', '#Inhalt', '#Geschichte', '#Kreativ', '#Kunst']
  },
  GOALS: {
    en: ['#vision', '#goals', '#future', '#habits', '#planning'],
    ko: ['#비전', '#목표', '#미래계획', '#습관', '#계획'],
    ja: ['#ビジョン', '#目標', '#未来', '#習慣', '#計画'],
    es: ['#visión', '#objetivos', '#futuro', '#hábitos', '#planificación'],
    fr: ['#vision', '#objectifs', '#futur', '#habitudes', '#planification'],
    de: ['#Vision', '#Ziele', '#Zukunft', '#Gewohnheiten', '#Planung']
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
  ko: Object.values(TAG_CATEGORIES).flatMap(cat => cat.ko),
  ja: Object.values(TAG_CATEGORIES).flatMap(cat => cat.ja),
  es: Object.values(TAG_CATEGORIES).flatMap(cat => cat.es),
  fr: Object.values(TAG_CATEGORIES).flatMap(cat => cat.fr),
  de: Object.values(TAG_CATEGORIES).flatMap(cat => cat.de)
};

// Helper function to get tags for a language with custom tags
export function getTagsForLanguage(language: 'en' | 'ko' | 'ja' | 'es' | 'fr' | 'de'): string[] {
  const defaultTags = ALL_TAGS[language] || ALL_TAGS.en;
  const customTags = getCustomTags(language);
  return [...defaultTags, ...customTags];
}

// Custom tags storage
export function getCustomTags(language: 'en' | 'ko' | 'ja' | 'es' | 'fr' | 'de'): string[] {
  const stored = localStorage.getItem(`custom-tags-${language}`);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function setCustomTags(language: 'en' | 'ko' | 'ja' | 'es' | 'fr' | 'de', tags: string[]): void {
  localStorage.setItem(`custom-tags-${language}`, JSON.stringify(tags));
}

export function addCustomTag(language: 'en' | 'ko' | 'ja' | 'es' | 'fr' | 'de', tag: string): void {
  const current = getCustomTags(language);
  if (!current.includes(tag)) {
    setCustomTags(language, [...current, tag]);
  }
}

export function removeCustomTag(language: 'en' | 'ko' | 'ja' | 'es' | 'fr' | 'de', tag: string): void {
  const current = getCustomTags(language);
  setCustomTags(language, current.filter(t => t !== tag));
}

export const APP_CONFIG = {
  MAX_AUDIO_DURATION: Number((import.meta as any).env?.VITE_MAX_AUDIO_DURATION) || 300000, // 5 minutes
  MAX_TEXT_LENGTH: Number((import.meta as any).env?.VITE_MAX_TEXT_LENGTH) || 1000, // Default 1000 characters
  SUPPORTED_LANGUAGES: ['en', 'ko', 'ja', 'es', 'fr', 'de'] as const
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
