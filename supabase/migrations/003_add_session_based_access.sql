-- Migration: Add session-based access control (interim solution before full Auth)
-- This provides basic isolation between users using browser session IDs

-- Step 1: Add session_id column
ALTER TABLE public.memos
  ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Step 2: Create index on session_id
CREATE INDEX IF NOT EXISTS idx_memos_session_id ON public.memos(session_id);

-- Step 3: Drop existing overly permissive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.memos;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.memos;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.memos;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.memos;

-- Step 4: Create session-based policies
-- Note: session_id will be passed from client (stored in localStorage)
-- This is NOT secure against malicious users, but provides basic isolation for MVP

-- SELECT: Can only see own memos (by session_id) or public memos (session_id is null for legacy data)
CREATE POLICY "Enable read access for own session" ON public.memos
    FOR SELECT
    USING (
        is_deleted = FALSE
        AND (
            session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
            OR session_id IS NULL  -- Legacy data without session_id
        )
    );

-- INSERT: Must provide session_id
CREATE POLICY "Enable insert with session_id" ON public.memos
    FOR INSERT
    WITH CHECK (
        session_id IS NOT NULL
        AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
    );

-- UPDATE: Can only update own memos
CREATE POLICY "Enable update for own session" ON public.memos
    FOR UPDATE
    USING (
        session_id IS NOT NULL
        AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
    );

-- DELETE: Can only delete own memos (soft delete)
CREATE POLICY "Enable delete for own session" ON public.memos
    FOR DELETE
    USING (
        session_id IS NOT NULL
        AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
    );

-- Step 5: Update active_memos view to include session filtering
DROP VIEW IF EXISTS public.active_memos;

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
    session_id,
    created_at,
    updated_at
FROM public.memos
WHERE is_deleted = FALSE
ORDER BY created_at DESC;

-- Step 6: Add helpful comments
COMMENT ON COLUMN public.memos.session_id IS 'Browser session ID for basic user isolation (interim solution before full Auth)';

-- Step 7: TODO for future
-- When implementing proper authentication:
-- 1. Add user_id column (UUID REFERENCES auth.users(id))
-- 2. Update policies to use auth.uid() instead of session_id
-- 3. Migrate existing session_id data to proper user_id
-- 4. Drop session_id column
