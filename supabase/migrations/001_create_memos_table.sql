-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create memos table
CREATE TABLE IF NOT EXISTS public.memos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    summary TEXT NOT NULL CHECK (char_length(summary) <= 500),
    tags TEXT[] NOT NULL CHECK (array_length(tags, 1) <= 3 AND array_length(tags, 1) > 0),
    context TEXT NOT NULL,
    insight TEXT,
    original_text TEXT NOT NULL,
    audio_url TEXT,
    language VARCHAR(2) DEFAULT 'en' CHECK (language IN ('en', 'ko')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Create indexes for better query performance
CREATE INDEX idx_memos_created_at ON public.memos(created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_memos_tags ON public.memos USING GIN(tags) WHERE is_deleted = FALSE;
CREATE INDEX idx_memos_context ON public.memos(context) WHERE is_deleted = FALSE;
CREATE INDEX idx_memos_language ON public.memos(language) WHERE is_deleted = FALSE;

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create full-text search index
CREATE INDEX idx_memos_summary_trgm ON public.memos USING GIN (summary gin_trgm_ops) WHERE is_deleted = FALSE;
CREATE INDEX idx_memos_original_text_trgm ON public.memos USING GIN (original_text gin_trgm_ops) WHERE is_deleted = FALSE;

-- Create full-text search vector column
ALTER TABLE public.memos ADD COLUMN search_vector tsvector;

-- Create index on search vector
CREATE INDEX idx_memos_search_vector ON public.memos USING GIN(search_vector) WHERE is_deleted = FALSE;

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_memo_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.original_text, '')), 'B') ||
        setweight(to_tsvector('simple', array_to_string(NEW.tags, ' ')), 'A');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vector
CREATE TRIGGER tg_memos_search_vector
    BEFORE INSERT OR UPDATE ON public.memos
    FOR EACH ROW
    EXECUTE FUNCTION update_memo_search_vector();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER tg_memos_updated_at
    BEFORE UPDATE ON public.memos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for MVP without auth)
CREATE POLICY "Enable read access for all users" ON public.memos
    FOR SELECT USING (is_deleted = FALSE);

CREATE POLICY "Enable insert access for all users" ON public.memos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.memos
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.memos
    FOR DELETE USING (true);

-- Create view for active memos
CREATE OR REPLACE VIEW public.active_memos AS
SELECT
    id,
    summary,
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

-- Grant permissions
GRANT ALL ON public.memos TO anon;
GRANT ALL ON public.memos TO authenticated;
GRANT SELECT ON public.active_memos TO anon;
GRANT SELECT ON public.active_memos TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.memos IS 'Stores AI-refined memos with tags and categorization';
COMMENT ON COLUMN public.memos.summary IS 'AI-refined summary (max 500 chars)';
COMMENT ON COLUMN public.memos.tags IS 'Array of 1-3 tags with # prefix';
COMMENT ON COLUMN public.memos.context IS 'Single context category';
COMMENT ON COLUMN public.memos.insight IS 'AI-generated insight (optional)';
COMMENT ON COLUMN public.memos.original_text IS 'Original user input';
COMMENT ON COLUMN public.memos.audio_url IS 'URL to audio file in Supabase Storage';
COMMENT ON COLUMN public.memos.language IS 'Language code: en or ko';
COMMENT ON COLUMN public.memos.search_vector IS 'Full-text search vector (auto-updated)';
