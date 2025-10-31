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

  // Send each memo as a separate page to Notion database
  const promises = memos.map(async (memo) => {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: {
          database_id: databaseId,
        },
        properties: {
          // Title property (most Notion databases have this)
          Name: {
            title: [
              {
                text: {
                  content: memo.refined.slice(0, 100), // Notion title max length
                },
              },
            ],
          },
          // Tags as multi-select
          Tags: {
            multi_select: memo.tags.map((tag) => ({ name: tag })),
          },
          // Context as select
          Context: {
            select: {
              name: memo.context,
            },
          },
          // Language as select
          Language: {
            select: {
              name: getNotionLanguageLabel(memo.language),
            },
          },
        },
        children: [
          // Summary as heading
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: '📝 Summary',
                  },
                },
              ],
            },
          },
          // Summary content
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: memo.refined,
                  },
                },
              ],
            },
          },
          // Insight if exists
          ...(memo.insight
            ? [
                {
                  object: 'block' as const,
                  type: 'heading_2' as const,
                  heading_2: {
                    rich_text: [
                      {
                        type: 'text' as const,
                        text: {
                          content: '💡 Insight',
                        },
                      },
                    ],
                  },
                },
                {
                  object: 'block' as const,
                  type: 'callout' as const,
                  callout: {
                    rich_text: [
                      {
                        type: 'text' as const,
                        text: {
                          content: memo.insight,
                        },
                      },
                    ],
                    icon: {
                      emoji: '💡',
                    },
                  },
                },
              ]
            : []),
          // Original text heading
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: '📄 Original Text',
                  },
                },
              ],
            },
          },
          // Original text as quote
          {
            object: 'block',
            type: 'quote',
            quote: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: memo.original_text || memo.refined,
                  },
                },
              ],
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Notion API Error: ${error.message || 'Unknown error'}`);
    }

    return response.json();
  });

  await Promise.all(promises);
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

    // Send to Notion
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: {
          database_id: databaseId,
        },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: memo.refined.slice(0, 100),
                },
              },
            ],
          },
          Tags: {
            multi_select: memo.tags.map((tag) => ({ name: tag })),
          },
          Context: {
            select: {
              name: memo.context,
            },
          },
          Language: {
            select: {
              name: getNotionLanguageLabel(memo.language),
            },
          },
        },
        children: [
          // Summary heading
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: '📝 Summary',
                  },
                },
              ],
            },
          },
          // Summary content
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: memo.refined,
                  },
                },
              ],
            },
          },
          // Insight if exists
          ...(memo.insight
            ? [
                {
                  object: 'block' as const,
                  type: 'heading_2' as const,
                  heading_2: {
                    rich_text: [
                      {
                        type: 'text' as const,
                        text: {
                          content: '💡 Insight',
                        },
                      },
                    ],
                  },
                },
                {
                  object: 'block' as const,
                  type: 'callout' as const,
                  callout: {
                    rich_text: [
                      {
                        type: 'text' as const,
                        text: {
                          content: memo.insight,
                        },
                      },
                    ],
                    icon: {
                      emoji: '💡',
                    },
                  },
                },
              ]
            : []),
          // Original text heading
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: '📄 Original Text',
                  },
                },
              ],
            },
          },
          // Original text as quote
          {
            object: 'block',
            type: 'quote',
            quote: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: memo.original_text || memo.refined,
                  },
                },
              ],
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Notion API Error: ${error.message || 'Unknown error'}`);
    }

    const notionPage = await response.json();

    // Update memo with sync success
    await supabase
      .from('memos')
      .update({
        notion_synced: true,
        notion_synced_at: new Date().toISOString(),
        notion_page_id: notionPage.id,
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
