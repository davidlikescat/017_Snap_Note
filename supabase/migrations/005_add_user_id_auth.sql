-- Migration: Add proper user authentication with auth.users
-- Replace session_id with user_id for Google OAuth integration

-- Step 1: Add user_id column
ALTER TABLE public.memos
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create index on user_id
CREATE INDEX IF NOT EXISTS idx_memos_user_id ON public.memos(user_id);

-- Step 3: Drop session-based policies
DROP POLICY IF EXISTS "Enable read access for own session" ON public.memos;
DROP POLICY IF EXISTS "Enable insert with session_id" ON public.memos;
DROP POLICY IF EXISTS "Enable update for own session" ON public.memos;
DROP POLICY IF EXISTS "Enable delete for own session" ON public.memos;

-- Step 4: Create user-based RLS policies using auth.uid()

-- SELECT: Users can only see their own memos
CREATE POLICY "Users can read own memos" ON public.memos
    FOR SELECT
    USING (
        is_deleted = FALSE
        AND user_id = auth.uid()
    );

-- INSERT: Users can only create memos for themselves
CREATE POLICY "Users can insert own memos" ON public.memos
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
    );

-- UPDATE: Users can only update their own memos
CREATE POLICY "Users can update own memos" ON public.memos
    FOR UPDATE
    USING (
        user_id = auth.uid()
    );

-- DELETE: Users can only delete their own memos (soft delete)
CREATE POLICY "Users can delete own memos" ON public.memos
    FOR DELETE
    USING (
        user_id = auth.uid()
    );

-- Step 5: Update active_memos view
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
    user_id,
    created_at,
    updated_at
FROM public.memos
WHERE is_deleted = FALSE
  AND user_id = auth.uid()
ORDER BY created_at DESC;

-- Step 6: Add helpful comments
COMMENT ON COLUMN public.memos.user_id IS 'User ID from auth.users - ensures data isolation between users';

-- Step 7: Update existing NULL user_id memos (if any exist)
-- Note: This will need manual intervention if you have existing data
-- For now, we'll leave session_id column for reference but it won't be used
COMMENT ON COLUMN public.memos.session_id IS 'DEPRECATED: Use user_id instead. Kept for migration reference only.';
