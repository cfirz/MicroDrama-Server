-- Example queries for testing the database

-- View all shows with their likes/dislikes
SELECT 
  s.id,
  s.title,
  s.description,
  COUNT(CASE WHEN r.rating_value = 1 THEN 1 END) AS likes,
  COUNT(CASE WHEN r.rating_value = 0 THEN 1 END) AS dislikes
FROM shows s
LEFT JOIN ratings r ON s.id = r.show_id
GROUP BY s.id, s.title, s.description
ORDER BY s.created_at DESC;

-- View all episodes for a specific show
SELECT 
  e.id,
  e.title,
  e."order",
  e.duration_sec,
  COALESCE(wh.watched, false) AS watched
FROM episodes e
LEFT JOIN watch_history wh ON e.id = wh.episode_id
WHERE e.show_id = (SELECT id FROM shows LIMIT 1)
ORDER BY e."order" ASC;

-- Count total ratings
SELECT 
  show_id,
  COUNT(*) as total_ratings,
  COUNT(CASE WHEN rating_value = 1 THEN 1 END) AS likes,
  COUNT(CASE WHEN rating_value = 0 THEN 1 END) AS dislikes
FROM ratings
GROUP BY show_id;

-- View watch history
SELECT 
  wh.id,
  e.title AS episode_title,
  s.title AS show_title,
  wh.watched,
  wh.created_at
FROM watch_history wh
JOIN episodes e ON wh.episode_id = e.id
JOIN shows s ON e.show_id = s.id
ORDER BY wh.updated_at DESC;

