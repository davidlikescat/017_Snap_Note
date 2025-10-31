-- Migration 004: Add Notion sync fields
-- Description: Add fields to track Notion synchronization status

-- Add Notion sync fields to memos table
ALTER TABLE public.memos
ADD COLUMN IF NOT EXISTS notion_synced BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notion_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notion_page_id TEXT,
ADD COLUMN IF NOT EXISTS sync_status TEXT CHECK (sync_status IN ('pending', 'synced', 'failed')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS sync_error TEXT,
ADD COLUMN IF NOT EXISTS sync_retry_count INTEGER DEFAULT 0;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_memos_notion_synced
ON public.memos(notion_synced)
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_memos_sync_status
ON public.memos(sync_status)
WHERE is_deleted = FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.memos.notion_synced IS 'Whether this memo has been successfully synced to Notion';
COMMENT ON COLUMN public.memos.notion_synced_at IS 'Timestamp of last successful Notion sync';
COMMENT ON COLUMN public.memos.notion_page_id IS 'Notion page ID for this memo (prevents duplicates)';
COMMENT ON COLUMN public.memos.sync_status IS 'Current sync status: pending, synced, or failed';
COMMENT ON COLUMN public.memos.sync_error IS 'Error message if sync failed';
COMMENT ON COLUMN public.memos.sync_retry_count IS 'Number of sync retry attempts';
