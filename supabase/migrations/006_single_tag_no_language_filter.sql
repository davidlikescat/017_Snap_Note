-- Migration: Convert from multiple tags (array) to single tag
-- Remove language filter capability while keeping language column for data
-- This aligns with Google Keep-style tag/label system

-- Step 1: Add new tag column (single value)
ALTER TABLE public.memos
  ADD COLUMN IF NOT EXISTS tag TEXT;

-- Step 2: Migrate data - take first tag from existing tags array
-- This preserves the most important tag (users typically put primary tag first)
UPDATE public.memos
SET tag = tags[1]
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;

-- Step 3: Make tag column NOT NULL after data migration
ALTER TABLE public.memos
  ALTER COLUMN tag SET NOT NULL;

-- Step 4: Drop old tags array column
ALTER TABLE public.memos
  DROP COLUMN IF EXISTS tags;

-- Step 5: Drop old GIN index on tags array (no longer exists)
DROP INDEX IF EXISTS idx_memos_tags;

-- Step 6: Create new B-tree index on single tag column
-- B-tree is more efficient for exact matching (= operator)
CREATE INDEX idx_memos_tag ON public.memos(tag) WHERE is_deleted = FALSE;

-- Step 7: Update search vector function to use single tag
DROP TRIGGER IF EXISTS tg_memos_search_vector ON public.memos;
DROP FUNCTION IF EXISTS update_memo_search_vector();

CREATE OR REPLACE FUNCTION update_memo_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.refined, NEW.summary, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.original_text, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.tag, '')), 'A');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_memos_search_vector
    BEFORE INSERT OR UPDATE ON public.memos
    FOR EACH ROW
    EXECUTE FUNCTION update_memo_search_vector();

-- Step 8: Update active_memos view to show tag instead of tags
DROP VIEW IF EXISTS public.active_memos;

CREATE OR REPLACE VIEW public.active_memos AS
SELECT
    id,
    refined,
    tag,
    context,
    insight,
    original_text,
    audio_url,
    language,
    user_id,
    created_at,
    updated_at
FROM public.memos
WHERE is_deleted = FALSE
  AND user_id = auth.uid()
ORDER BY created_at DESC;

-- Step 9: Update comments
COMMENT ON COLUMN public.memos.tag IS 'Single primary tag/label for the memo (Google Keep style)';

-- Step 10: Refresh search vectors for existing data
UPDATE public.memos
SET search_vector = (
    setweight(to_tsvector('english', COALESCE(refined, summary, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(original_text, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(tag, '')), 'A')
)
WHERE search_vector IS NULL OR tag IS NOT NULL;
