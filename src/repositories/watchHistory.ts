import { Pool } from 'pg';

export interface WatchHistory {
  id: string;
  episodeId: string;
  watched: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const getWatchHistoryRow = (row: any): WatchHistory => ({
  id: row.id,
  episodeId: row.episode_id,
  watched: row.watched,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function markEpisodeAsWatched(
  pool: Pool,
  episodeId: string
): Promise<WatchHistory> {
  // Use INSERT ... ON CONFLICT (upsert) to handle duplicate episode_id
  // For MVP, we assume one watch record per episode (no user_id yet)
  // Future: will need unique constraint on (user_id, episode_id)
  
  const query = `
    INSERT INTO watch_history (episode_id, watched, created_at, updated_at)
    VALUES ($1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (episode_id) DO UPDATE
    SET watched = true, updated_at = CURRENT_TIMESTAMP
    RETURNING id, episode_id, watched, created_at, updated_at
  `;

  const result = await pool.query(query, [episodeId]);
  return getWatchHistoryRow(result.rows[0]);
}

export async function getWatchStatus(pool: Pool, episodeId: string): Promise<boolean> {
  const query = `
    SELECT watched
    FROM watch_history
    WHERE episode_id = $1
  `;

  const result = await pool.query(query, [episodeId]);
  
  if (result.rows.length === 0) {
    return false;
  }

  return result.rows[0].watched === true;
}

