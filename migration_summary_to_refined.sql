-- Migration: Change 'summary' to 'refined' in memos table
-- WARNING: This will delete all existing data

-- Step 1: Drop the old table
DROP TABLE IF EXISTS memos;

-- Step 2: Create new table with 'refined' field
CREATE TABLE memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refined TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  context TEXT NOT NULL,
  insight TEXT,
  original_text TEXT NOT NULL,
  audio_url TEXT,
  language VARCHAR(2) DEFAULT 'ko',
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Step 3: Create index for better query performance
CREATE INDEX idx_memos_created_at ON memos(created_at DESC);
CREATE INDEX idx_memos_tags ON memos USING GIN(tags);
CREATE INDEX idx_memos_is_deleted ON memos(is_deleted);
