export interface Memo {
  id: string;
  refined: string;
  tag: string;
  context: MemoContext;
  insight: string | null;
  original_text: string;
  audio_url: string | null;
  language: 'en' | 'ko' | 'ja' | 'es' | 'fr' | 'de';
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  version: number;
  // Notion sync fields
  notion_synced?: boolean;
  notion_synced_at?: string;
  notion_page_id?: string;
  sync_status?: 'pending' | 'synced' | 'failed';
  sync_error?: string;
  sync_retry_count?: number;
}

export type MemoContext =
  | 'Idea'
  | 'Idea Development'
  | 'Work Memo'
  | 'Work Log'
  | 'Meeting Notes'
  | 'Teaching Idea'
  | 'Coaching Note'
  | 'Personal Reflection'
  | 'Learning Memo'
  | 'Relationship Notes'
  | 'Emotion Exploration'
  | 'Goal Check'
  | 'Feedback Review'
  | 'Memory Log'
  | 'Observation Note'
  | 'Inspiration'
  | 'Philosophy Memo'
  | 'Content Idea'
  | 'Story Note'
  | 'Goal Setting'
  | 'Habit Log'
  | 'Memory Archive';

export interface CreateMemoInput {
  refined: string;
  tag: string;
  context: MemoContext;
  insight?: string;
  original_text: string;
  audio_url?: string;
  language: 'en' | 'ko' | 'ja' | 'es' | 'fr' | 'de';
}

export interface UpdateMemoInput {
  id: string;
  refined?: string;
  tag?: string;
  context?: MemoContext;
  insight?: string;
}

export interface MemoFilters {
  tag?: string;
  context?: MemoContext;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AIRefinementResult {
  refined: string;
  tag: string;
  context: MemoContext;
  insight: string;
  language?: 'en' | 'ko' | 'ja' | 'es' | 'fr' | 'de';
  isAIRefined?: boolean; // true if AI processed, false if fallback used
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
}

export type InputMode = 'voice' | 'text';
