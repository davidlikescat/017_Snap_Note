import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case "GET":
        return await getMemos(req, res);
      case "POST":
        return await createMemo(req, res);
      case "PATCH":
        return await updateMemo(req, res);
      case "DELETE":
        return await deleteMemo(req, res);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// GET /api/memo - List memos with filters
async function getMemos(req: VercelRequest, res: VercelResponse) {
  const {
    tags,
    context,
    language,
    search,
    limit = "20",
    offset = "0",
  } = req.query;

  let query = supabase
    .from("memos")
    .select("*", { count: "exact" })
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  // Apply filters
  if (context && typeof context === "string") {
    query = query.eq("context", context);
  }

  if (language && typeof language === "string") {
    query = query.eq("language", language);
  }

  if (tags && typeof tags === "string") {
    // Filter by tags (array overlap)
    const tagArray = tags.split(",");
    query = query.overlaps("tags", tagArray);
  }

  if (search && typeof search === "string") {
    // Full-text search using search_vector
    query = query.textSearch("search_vector", search);
  }

  // Pagination
  const limitNum = parseInt(limit as string) || 20;
  const offsetNum = parseInt(offset as string) || 0;
  query = query.range(offsetNum, offsetNum + limitNum - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Query error:", error);
    return res.status(500).json({ error: "Failed to fetch memos" });
  }

  return res.status(200).json({
    memos: data,
    total: count,
    limit: limitNum,
    offset: offsetNum,
  });
}

// POST /api/memo - Create new memo
async function createMemo(req: VercelRequest, res: VercelResponse) {
  const { summary, tags, context, insight, original_text, audio_url, language } =
    req.body;

  // Validation
  if (!summary || !tags || !context || !original_text) {
    return res.status(400).json({
      error: "Missing required fields",
      required: ["summary", "tags", "context", "original_text"],
    });
  }

  if (!Array.isArray(tags) || tags.length < 1 || tags.length > 3) {
    return res.status(400).json({
      error: "Tags must be an array of 1-3 items",
    });
  }

  const { data, error } = await supabase
    .from("memos")
    .insert({
      summary,
      tags,
      context,
      insight: insight || null,
      original_text,
      audio_url: audio_url || null,
      language: language || "en",
    })
    .select()
    .single();

  if (error) {
    console.error("Insert error:", error);
    return res.status(500).json({ error: "Failed to create memo" });
  }

  return res.status(201).json(data);
}

// PATCH /api/memo?id=xxx - Update memo
async function updateMemo(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const { summary, tags, context, insight } = req.body;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Memo ID is required" });
  }

  const updates: any = {};
  if (summary) updates.summary = summary;
  if (tags) updates.tags = tags;
  if (context) updates.context = context;
  if (insight !== undefined) updates.insight = insight;

  const { data, error } = await supabase
    .from("memos")
    .update(updates)
    .eq("id", id)
    .eq("is_deleted", false)
    .select()
    .single();

  if (error) {
    console.error("Update error:", error);
    return res.status(500).json({ error: "Failed to update memo" });
  }

  if (!data) {
    return res.status(404).json({ error: "Memo not found" });
  }

  return res.status(200).json(data);
}

// DELETE /api/memo?id=xxx - Soft delete memo
async function deleteMemo(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Memo ID is required" });
  }

  const { data, error } = await supabase
    .from("memos")
    .update({ is_deleted: true })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ error: "Failed to delete memo" });
  }

  if (!data) {
    return res.status(404).json({ error: "Memo not found" });
  }

  return res.status(200).json({ message: "Memo deleted", id });
}
