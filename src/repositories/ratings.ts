import { Pool } from 'pg';
import { Rating } from '../types/rating';

const getRatingRow = (row: any): Rating => ({
  id: row.id,
  showId: row.show_id,
  ratingValue: row.rating_value as 0 | 1,
  createdAt: row.created_at,
});

export async function createRating(
  pool: Pool,
  showId: string,
  ratingValue: 0 | 1
): Promise<Rating> {
  const query = `
    INSERT INTO ratings (show_id, rating_value)
    VALUES ($1, $2)
    RETURNING id, show_id, rating_value, created_at
  `;

  const result = await pool.query(query, [showId, ratingValue]);
  return getRatingRow(result.rows[0]);
}

export async function getRatingCounts(pool: Pool, showId: string): Promise<{
  likes: number;
  dislikes: number;
}> {
  const query = `
    SELECT 
      COUNT(CASE WHEN rating_value = 1 THEN 1 END) AS likes,
      COUNT(CASE WHEN rating_value = 0 THEN 1 END) AS dislikes
    FROM ratings
    WHERE show_id = $1
  `;

  const result = await pool.query(query, [showId]);
  const row = result.rows[0];
  
  return {
    likes: parseInt(row.likes, 10) || 0,
    dislikes: parseInt(row.dislikes, 10) || 0,
  };
}

