import { Memo } from '@/types/memo';
import type { AppLanguage } from '@/stores/useLanguageStore';
import { supabase } from '@/lib/supabase';

interface NotionSettings {
  apiKey: string;
  databaseId: string;
  autoSync?: boolean;
}

const NOTION_LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: 'English',
  ko: 'Korean',
  ja: 'Japanese',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
};

function getNotionLanguageLabel(language: Memo['language']): string {
  return NOTION_LANGUAGE_LABELS[language as AppLanguage] ?? NOTION_LANGUAGE_LABELS.en;
}

export function getNotionSettings(): NotionSettings | null {
  const saved = localStorage.getItem('notionSettings');
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch (error) {
    console.error('Failed to parse notion settings:', error);
    return null;
  }
}

export async function sendMemosToNotion(memos: Memo[]): Promise<void> {
  const settings = getNotionSettings();

  if (!settings) {
    throw new Error('Notion 설정이 없습니다. Settings 페이지에서 먼저 설정해주세요.');
  }

  const { apiKey, databaseId } = settings;

  // Use backend API to avoid CORS issues
  const response = await fetch('/api/notion-sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey,
      databaseId,
      memos,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    if (data.errors && data.errors.length > 0) {
      throw new Error(`Failed to sync ${data.errors.length} memo(s): ${data.errors[0].error}`);
    }
    throw new Error(data.error || 'Failed to sync memos to Notion');
  }

  console.log(`[NOTION] Successfully synced ${data.summary.succeeded} memo(s)`);
}

/**
 * Auto-sync single memo to Notion with retry logic
 * Called automatically when a memo is created if autoSync is enabled
 */
export async function autoSyncMemoToNotion(memo: Memo): Promise<void> {
  const settings = getNotionSettings();

  // Check if auto-sync is enabled
  if (!settings || !settings.autoSync) {
    console.log('⏭️ [Notion] Auto-sync is disabled, skipping');
    return;
  }

  const { apiKey, databaseId } = settings;

  if (!apiKey || !databaseId) {
    console.warn('⚠️ [Notion] API Key or Database ID not configured');
    return;
  }

  console.log(`🔄 [Notion] Auto-syncing memo ${memo.id}...`);

  try {
    // Check if already synced
    if (memo.notion_synced && memo.notion_page_id) {
      console.log(`✅ [Notion] Memo ${memo.id} already synced, skipping`);
      return;
    }

    // Mark as pending
    await supabase
      .from('memos')
      .update({ sync_status: 'pending' })
      .eq('id', memo.id);

    // Send to Notion via backend API
    const response = await fetch('/api/notion-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        databaseId,
        memos: [memo], // Send as single-item array
      }),
    });

    const data = await response.json();

    if (!data.success || data.results.length === 0) {
      const errorMessage = data.errors?.[0]?.error || data.error || 'Unknown error';
      throw new Error(`Notion API Error: ${errorMessage}`);
    }

    const notionPageId = data.results[0].notionPageId;

    // Update memo with sync success
    await supabase
      .from('memos')
      .update({
        notion_synced: true,
        notion_synced_at: new Date().toISOString(),
        notion_page_id: notionPageId,
        sync_status: 'synced',
        sync_error: null,
        sync_retry_count: 0,
      })
      .eq('id', memo.id);

    console.log(`✅ [Notion] Memo ${memo.id} synced successfully`);
  } catch (error: any) {
    console.error(`❌ [Notion] Failed to sync memo ${memo.id}:`, error);

    // Update memo with error status
    const retryCount = (memo.sync_retry_count || 0) + 1;
    const maxRetries = 3;

    await supabase
      .from('memos')
      .update({
        sync_status: retryCount >= maxRetries ? 'failed' : 'pending',
        sync_error: error?.message?.slice(0, 1000) || 'Unknown error',
        sync_retry_count: retryCount,
      })
      .eq('id', memo.id);

    // Don't throw - just log the error
    // This prevents the memo creation from failing
  }
}
