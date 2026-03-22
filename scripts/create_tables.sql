-- ============================================================
-- AF4 Autofocus App — Database Schema
-- Run this in Supabase SQL Editor to set up all tables
-- ============================================================


-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE task_status AS ENUM ('active', 'in-progress', 'completed');
CREATE TYPE timer_state AS ENUM ('idle', 'running', 'paused', 'stopped');
CREATE TYPE default_filter AS ENUM ('all', 'none');


-- ============================================================
-- TASKS TABLE
-- ============================================================

CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text            TEXT NOT NULL,
    status          task_status NOT NULL DEFAULT 'active',
    page_number     INTEGER NOT NULL DEFAULT 1,
    position        INTEGER NOT NULL DEFAULT 0,
    tag             TEXT DEFAULT NULL,  -- no CHECK constraint, controlled by app
    total_time_ms   BIGINT NOT NULL DEFAULT 0,
    added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ DEFAULT NULL,
    re_entered_from UUID DEFAULT NULL REFERENCES tasks(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_tasks_status        ON tasks(status);
CREATE INDEX idx_tasks_page_position ON tasks(page_number, position);
CREATE INDEX idx_tasks_completed_at  ON tasks(completed_at DESC) WHERE status = 'completed';
CREATE INDEX idx_tasks_tag           ON tasks(tag) WHERE tag IS NOT NULL;


-- ============================================================
-- APP STATE TABLE (singleton row)
-- ============================================================

CREATE TABLE app_state (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    working_on_task_id   UUID DEFAULT NULL REFERENCES tasks(id) ON DELETE SET NULL,
    timer_state          timer_state NOT NULL DEFAULT 'idle',
    session_start_time   TIMESTAMPTZ DEFAULT NULL,
    current_session_ms   BIGINT NOT NULL DEFAULT 0,
    current_page         INTEGER NOT NULL DEFAULT 1,
    page_size            INTEGER NOT NULL DEFAULT 12,
    default_filter       default_filter NOT NULL DEFAULT 'all',
    theme                TEXT NOT NULL DEFAULT 'light',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert the singleton row with the fixed ID the app expects
INSERT INTO app_state (
    id,
    timer_state,
    current_session_ms,
    current_page,
    page_size,
    default_filter,
    theme
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'idle',
    0,
    1,
    12,
    'all',
    'light'
);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on both tables
ALTER TABLE tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

-- Tasks: authenticated users can do everything
CREATE POLICY "tasks_all" ON tasks
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- App state: authenticated users can do everything
CREATE POLICY "app_state_all" ON app_state
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER app_state_updated_at
    BEFORE UPDATE ON app_state
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- NOTES FOR DUPLICATING THIS APP
-- ============================================================
-- 1. Create a new Supabase project
-- 2. Run this entire file in the Supabase SQL Editor
-- 3. Copy your .env.local with the new project's URL and anon key
-- 4. The singleton app_state row is created automatically above
-- 5. Tags are stored as plain text — no constraint — add any tag
--    ids to TAG_DEFINITIONS in src/lib/tags.ts freely
-- 6. Page size is hardcoded as 12 in DEFAULT_TASK_CAPACITY in
--    autofocus-app.tsx — keep in sync with page_size in app_state
-- ============================================================