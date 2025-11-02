-- Migration 007: Rename summary column to refined for consistency
-- This aligns the database column name with frontend code naming

-- Step 1: Rename the column
ALTER TABLE public.memos
  RENAME COLUMN summary TO refined;

-- Step 2: Update the view to use refined
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

-- Step 3: Update search vector function to use refined
DROP TRIGGER IF EXISTS tg_memos_search_vector ON public.memos;
DROP FUNCTION IF EXISTS update_memo_search_vector();

CREATE OR REPLACE FUNCTION update_memo_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.refined, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.original_text, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.tag, '')), 'A');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_memos_search_vector
    BEFORE INSERT OR UPDATE ON public.memos
    FOR EACH ROW
    EXECUTE FUNCTION update_memo_search_vector();

-- Step 4: Update column comment
COMMENT ON COLUMN public.memos.refined IS 'AI-refined version of the original text (polished and professional)';

-- Step 5: Refresh search vectors with new column name
UPDATE public.memos
SET search_vector = (
    setweight(to_tsvector('english', COALESCE(refined, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(original_text, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(tag, '')), 'A')
)
WHERE refined IS NOT NULL;
