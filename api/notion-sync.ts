import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Notion API Sync Endpoint
 *
 * POST /api/notion-sync
 * Body: { apiKey: string, databaseId: string, memos: Memo[] }
 *
 * Sends memos to Notion database
 */

interface Memo {
  id: string;
  refined: string;
  original_text: string;
  tags: string[];
  context: string;
  language: string;
  insight?: string;
  created_at: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  ko: 'Korean',
  ja: 'Japanese',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { apiKey, databaseId, memos } = req.body;

    if (!apiKey || !databaseId || !memos) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "apiKey, databaseId, and memos are required"
      });
    }

    if (!Array.isArray(memos) || memos.length === 0) {
      return res.status(400).json({
        error: "Invalid memos",
        details: "memos must be a non-empty array"
      });
    }

    console.log(`[NOTION SYNC] Syncing ${memos.length} memo(s) to database:`, databaseId);

    const results = [];
    const errors = [];

    // Send each memo as a separate page
    for (const memo of memos) {
      try {
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
              // Use default "title" property (Notion's default title field)
              title: {
                title: [
                  {
                    text: {
                      content: memo.refined.slice(0, 100),
                    },
                  },
                ],
              },
              // Set Status to "To Do" (matching your database)
              Status: {
                select: {
                  name: 'To Do',
                },
              },
            },
            children: [
              // Metadata (Tags, Context, Language)
              {
                object: 'block',
                type: 'callout',
                callout: {
                  rich_text: [
                    {
                      type: 'text',
                      text: {
                        content: `📌 Tags: ${memo.tags.join(', ')}\n🗂️ Context: ${memo.context}\n🌐 Language: ${LANGUAGE_LABELS[memo.language] || 'English'}`,
                      },
                    },
                  ],
                  icon: {
                    emoji: '📋',
                  },
                  color: 'gray_background',
                },
              },
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
          console.error(`[NOTION SYNC] Failed to sync memo ${memo.id}:`, error);
          errors.push({
            memoId: memo.id,
            error: error.message || 'Unknown error',
            code: error.code,
          });
        } else {
          const notionPage = await response.json();
          console.log(`[NOTION SYNC] Successfully synced memo ${memo.id} to page ${notionPage.id}`);
          results.push({
            memoId: memo.id,
            notionPageId: notionPage.id,
            url: notionPage.url,
          });
        }
      } catch (error: any) {
        console.error(`[NOTION SYNC] Error syncing memo ${memo.id}:`, error);
        errors.push({
          memoId: memo.id,
          error: error.message || 'Unknown error',
        });
      }
    }

    console.log(`[NOTION SYNC] Completed: ${results.length} success, ${errors.length} failed`);

    return res.status(200).json({
      success: errors.length === 0,
      results,
      errors,
      summary: {
        total: memos.length,
        succeeded: results.length,
        failed: errors.length,
      },
    });

  } catch (error: any) {
    console.error("[NOTION SYNC] Error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
      details: error,
    });
  }
}
