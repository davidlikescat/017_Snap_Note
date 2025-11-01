import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Notion API Test Connection Endpoint
 *
 * POST /api/notion-test
 * Body: { apiKey: string, databaseId: string }
 *
 * Tests connection to Notion API by fetching database info
 */
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
    const { apiKey, databaseId } = req.body;

    if (!apiKey || !databaseId) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "apiKey and databaseId are required"
      });
    }

    console.log("[NOTION TEST] Testing connection to database:", databaseId);

    // Test connection by fetching database info
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[NOTION TEST] Failed:", error);

      return res.status(response.status).json({
        success: false,
        error: error.message || 'Failed to connect to Notion',
        code: error.code,
        details: error,
      });
    }

    const database = await response.json();

    console.log("[NOTION TEST] Success! Database:", database.title?.[0]?.plain_text || 'Untitled');

    return res.status(200).json({
      success: true,
      database: {
        id: database.id,
        title: database.title?.[0]?.plain_text || 'Untitled',
        url: database.url,
      },
    });

  } catch (error: any) {
    console.error("[NOTION TEST] Error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
      details: error,
    });
  }
}
