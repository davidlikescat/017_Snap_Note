import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application': 'mind-note'
    }
  }
});

// Database types
export type Database = {
  public: {
    Tables: {
      memos: {
        Row: {
          id: string;
          refined: string;
          tags: string[];
          context: string;
          insight: string | null;
          original_text: string;
          audio_url: string | null;
          language: 'en' | 'ko';
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          id?: string;
          refined: string;
          tags: string[];
          context: string;
          insight?: string | null;
          original_text: string;
          audio_url?: string | null;
          language?: 'en' | 'ko';
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          id?: string;
          refined?: string;
          tags?: string[];
          context?: string;
          insight?: string | null;
          original_text?: string;
          audio_url?: string | null;
          language?: 'en' | 'ko';
          is_deleted?: boolean;
          updated_at?: string;
          version?: number;
        };
      };
    };
  };
};
