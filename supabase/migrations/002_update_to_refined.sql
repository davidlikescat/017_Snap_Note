-- Migration: Update schema to use 'refined' instead of 'summary'
-- This migration also fixes language constraints and search vector

-- Step 1: Drop existing policies and triggers
DROP POLICY IF EXISTS "Enable read access for all users" ON public.memos;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.memos;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.memos;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.memos;
DROP TRIGGER IF EXISTS tg_memos_search_vector ON public.memos;
DROP TRIGGER IF EXISTS tg_memos_updated_at ON public.memos;
DROP FUNCTION IF EXISTS update_memos_search_vector();
DROP VIEW IF EXISTS public.active_memos;

-- Step 2: Rename column from 'summary' to 'refined'
ALTER TABLE public.memos
  RENAME COLUMN summary TO refined;

-- Step 3: Update refined column constraints (increase max length)
ALTER TABLE public.memos
  DROP CONSTRAINT IF EXISTS memos_summary_check;

ALTER TABLE public.memos
  ADD CONSTRAINT memos_refined_check
  CHECK (char_length(refined) <= 1000);

-- Step 4: Update language constraint to support all languages
ALTER TABLE public.memos
  DROP CONSTRAINT IF EXISTS memos_language_check;

ALTER TABLE public.memos
  ADD CONSTRAINT memos_language_check
  CHECK (language IN ('en', 'ko', 'ja', 'es', 'fr', 'de'));

-- Step 5: Update search vector function for multilingual support
CREATE OR REPLACE FUNCTION update_memos_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(
            to_tsvector(
                CASE
                    WHEN NEW.language = 'ko' THEN 'simple'
                    WHEN NEW.language = 'ja' THEN 'simple'
                    ELSE 'english'
                END,
                COALESCE(NEW.refined, '')
            ),
            'A'
        ) ||
        setweight(
            to_tsvector(
                CASE
                    WHEN NEW.language = 'ko' THEN 'simple'
                    WHEN NEW.language = 'ja' THEN 'simple'
                    ELSE 'english'
                END,
                COALESCE(NEW.original_text, '')
            ),
            'B'
        ) ||
        setweight(to_tsvector('simple', array_to_string(NEW.tags, ' ')), 'A');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Recreate trigger
CREATE TRIGGER tg_memos_search_vector
    BEFORE INSERT OR UPDATE ON public.memos
    FOR EACH ROW
    EXECUTE FUNCTION update_memos_search_vector();

-- Step 7: Update existing search vectors
UPDATE public.memos SET search_vector =
    setweight(
        to_tsvector(
            CASE
                WHEN language = 'ko' THEN 'simple'
                WHEN language = 'ja' THEN 'simple'
                ELSE 'english'
            END,
            COALESCE(refined, '')
        ),
        'A'
    ) ||
    setweight(
        to_tsvector(
            CASE
                WHEN language = 'ko' THEN 'simple'
                WHEN language = 'ja' THEN 'simple'
                ELSE 'english'
            END,
            COALESCE(original_text, '')
        ),
        'B'
    ) ||
    setweight(to_tsvector('simple', array_to_string(tags, ' ')), 'A');

-- Step 8: Recreate active_memos view
CREATE OR REPLACE VIEW public.active_memos AS
SELECT
    id,
    refined,
    tags,
    context,
    insight,
    original_text,
    audio_url,
    language,
    created_at,
    updated_at
FROM public.memos
WHERE is_deleted = FALSE
ORDER BY created_at DESC;

-- Step 9: Recreate RLS policies (keeping MVP open access for now)
CREATE POLICY "Enable read access for all users" ON public.memos
    FOR SELECT USING (is_deleted = FALSE);

CREATE POLICY "Enable insert access for all users" ON public.memos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.memos
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.memos
    FOR DELETE USING (true);

-- Step 10: Update table comment
COMMENT ON TABLE public.memos IS 'Stores AI-refined memos with tags and categorization. Updated to use refined field (max 1000 chars) and support multiple languages.';
COMMENT ON COLUMN public.memos.refined IS 'AI-refined version of the original text (preserves all content, converts to clear written form)';
