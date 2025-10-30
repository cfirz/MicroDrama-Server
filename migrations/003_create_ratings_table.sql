-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  rating_value INTEGER NOT NULL CHECK (rating_value IN (0, 1)),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on show_id for faster aggregation queries
CREATE INDEX IF NOT EXISTS idx_ratings_show_id ON ratings(show_id);
CREATE INDEX IF NOT EXISTS idx_ratings_value ON ratings(show_id, rating_value);

