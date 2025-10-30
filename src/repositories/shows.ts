import { Pool } from 'pg';
import { Show, ShowWithEpisodes } from '../types/show';
import { EpisodeWithWatchStatus } from '../types/episode';

const getShowRow = (row: any): Show => ({
  id: row.id,
  title: row.title,
  description: row.description,
  coverUrl: row.cover_url,
  likes: parseInt(row.likes, 10) || 0,
  dislikes: parseInt(row.dislikes, 10) || 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const getEpisodeRow = (row: any): EpisodeWithWatchStatus => ({
  id: row.episode_id,
  showId: row.show_id,
  title: row.episode_title,
  order: row.episode_order,
  muxPlaybackId: row.mux_playback_id,
  durationSec: row.duration_sec,
  thumbnailUrl: row.thumbnail_url,
  createdAt: row.episode_created_at,
  updatedAt: row.episode_updated_at,
  watched: row.watched ?? false,
});

export async function getAllShows(pool: Pool): Promise<Show[]> {
  const query = `
    SELECT 
      s.id,
      s.title,
      s.description,
      s.cover_url,
      s.created_at,
      s.updated_at,
      COALESCE(SUM(CASE WHEN r.rating_value = 1 THEN 1 ELSE 0 END), 0)::INTEGER AS likes,
      COALESCE(SUM(CASE WHEN r.rating_value = 0 THEN 1 ELSE 0 END), 0)::INTEGER AS dislikes
    FROM shows s
    LEFT JOIN ratings r ON s.id = r.show_id
    GROUP BY s.id, s.title, s.description, s.cover_url, s.created_at, s.updated_at
    ORDER BY s.created_at DESC
  `;

  const result = await pool.query(query);
  return result.rows.map(getShowRow);
}

export async function getShowById(pool: Pool, id: string): Promise<ShowWithEpisodes | null> {
  // First get the show with ratings
  const showQuery = `
    SELECT 
      s.id,
      s.title,
      s.description,
      s.cover_url,
      s.created_at,
      s.updated_at,
      COALESCE(SUM(CASE WHEN r.rating_value = 1 THEN 1 ELSE 0 END), 0)::INTEGER AS likes,
      COALESCE(SUM(CASE WHEN r.rating_value = 0 THEN 1 ELSE 0 END), 0)::INTEGER AS dislikes
    FROM shows s
    LEFT JOIN ratings r ON s.id = r.show_id
    WHERE s.id = $1
    GROUP BY s.id, s.title, s.description, s.cover_url, s.created_at, s.updated_at
  `;

  const showResult = await pool.query(showQuery, [id]);
  
  if (showResult.rows.length === 0) {
    return null;
  }

  const show = getShowRow(showResult.rows[0]);

  // Then get episodes with watch status
  const episodesQuery = `
    SELECT 
      e.id AS episode_id,
      e.show_id,
      e.title AS episode_title,
      e."order" AS episode_order,
      e.mux_playback_id,
      e.duration_sec,
      e.thumbnail_url,
      e.created_at AS episode_created_at,
      e.updated_at AS episode_updated_at,
      COALESCE(wh.watched, false) AS watched
    FROM episodes e
    LEFT JOIN watch_history wh ON e.id = wh.episode_id
    WHERE e.show_id = $1
    ORDER BY e."order" ASC
  `;

  const episodesResult = await pool.query(episodesQuery, [id]);
  const episodes = episodesResult.rows.map(getEpisodeRow);

  return {
    ...show,
    episodes,
  };
}

