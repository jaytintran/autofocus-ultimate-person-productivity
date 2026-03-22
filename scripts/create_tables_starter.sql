-- AF4 Autofocus App — Database Schema --

-- Create tasks table for AF4 Autofocus system
-- No RLS since this is a single-user local app without auth
-- Run this once in your Supabase SQL Editor when setting up a new project.
-- For full setup instructions see README.md

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in-progress', 'completed')),
  page_number INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_time_ms BIGINT NOT NULL DEFAULT 0,
  re_entered_from UUID REFERENCES tasks(id) ON DELETE SET NULL,
  tag TEXT, -- No check constraint: TagId type in TypeScript enforces valid values
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create app_state table (singleton for app-wide state)
CREATE TABLE IF NOT EXISTS app_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_page INTEGER NOT NULL DEFAULT 1,
  page_size INTEGER NOT NULL DEFAULT 12, -- AF4 page size is 12 tasks per page
  working_on_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  session_start_time TIMESTAMPTZ,
  timer_state TEXT NOT NULL DEFAULT 'idle' CHECK (timer_state IN ('idle', 'running', 'paused', 'stopped')),
  current_session_ms BIGINT NOT NULL DEFAULT 0,
  default_filter TEXT NOT NULL DEFAULT 'all' CHECK (default_filter IN ('all', 'none')),
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_page_number ON tasks(page_number);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(position);
CREATE INDEX IF NOT EXISTS idx_tasks_added_at ON tasks(added_at);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at); -- for paginated completed tasks query
CREATE INDEX IF NOT EXISTS idx_tasks_tag ON tasks(tag); -- for tag filtering

-- Insert default app state singleton if not exists
INSERT INTO app_state (
  id,
  current_page,
  page_size,
  timer_state,
  current_session_ms,
  default_filter,
  theme
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  1,
  12,
  'idle',
  0,
  'all',
  'light'
)
ON CONFLICT (id) DO NOTHING;