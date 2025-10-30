-- Test connection query
-- Run this to verify your PostgreSQL connection is working

-- Test 1: Check current database
SELECT current_database();

-- Test 2: Check PostgreSQL version
SELECT version();

-- Test 3: List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Test 4: Count records in each table
SELECT 'shows' as table_name, COUNT(*) as row_count FROM shows
UNION ALL
SELECT 'episodes', COUNT(*) FROM episodes
UNION ALL
SELECT 'ratings', COUNT(*) FROM ratings
UNION ALL
SELECT 'watch_history', COUNT(*) FROM watch_history;

