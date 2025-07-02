-- Cleanup script for timer sessions
-- This script removes duplicate timer sessions and ensures only one session per timer

-- Step 1: Create a temporary table with the latest session for each timer
CREATE TEMP TABLE latest_sessions AS
SELECT DISTINCT ON (timer_id) 
    id, timer_id, kickoff, deadline, last_stop, status
FROM timer_sessions 
ORDER BY timer_id, id DESC;

-- Step 2: Delete all timer sessions
DELETE FROM timer_sessions;

-- Step 3: Insert back only the latest sessions
INSERT INTO timer_sessions (timer_id, kickoff, deadline, last_stop, status)
SELECT timer_id, kickoff, deadline, last_stop, status
FROM latest_sessions;

-- Step 4: Add unique constraint on timer_id (if not already exists)
ALTER TABLE timer_sessions 
ADD CONSTRAINT timer_sessions_timer_id_unique 
UNIQUE (timer_id);

-- Verify the cleanup
SELECT 
    COUNT(*) as total_sessions,
    COUNT(DISTINCT timer_id) as unique_timers
FROM timer_sessions;
