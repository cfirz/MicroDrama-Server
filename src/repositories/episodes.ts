import { Pool } from 'pg';
import { EpisodeWithWatchStatus } from '../types/episode';
import { FilterOptions, SortOptions } from '../types/filters';

const getEpisodeRow = (row: any): EpisodeWithWatchStatus => ({
  id: row.id,
  showId: row.show_id,
  title: row.title,
  order: row.order_number,
  muxPlaybackId: row.mux_playback_id,
  durationSec: row.duration_sec,
  thumbnailUrl: row.thumbnail_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  watched: row.watched ?? false,
});

export async function getEpisodesByShowId(
  pool: Pool,
  showId: string,
  filters?: FilterOptions,
  sortOptions?: SortOptions
): Promise<EpisodeWithWatchStatus[]> {
  let query = `
    SELECT 
      e.id,
      e.show_id,
      e.title,
      e."order" AS order_number,
      e.mux_playback_id,
      e.duration_sec,
      e.thumbnail_url,
      e.created_at,
      e.updated_at,
      COALESCE(wh.watched, false) AS watched
    FROM episodes e
    LEFT JOIN watch_history wh ON e.id = wh.episode_id
    WHERE e.show_id = $1
  `;

  const params: any[] = [showId];

  // Apply watch filter
  if (filters?.filterBy === 'watched') {
    query += ` AND COALESCE(wh.watched, false) = true`;
  } else if (filters?.filterBy === 'unwatched') {
    query += ` AND (wh.watched = false OR wh.watched IS NULL)`;
  }

  // Apply sorting
  const sortBy = sortOptions?.sortBy ?? 'order';
  const orderBy = sortOptions?.orderBy ?? 'asc';

  // Map sortBy to actual column names
  const sortColumnMap: Record<string, string> = {
    title: 'e.title',
    order: 'e."order"',
    created_at: 'e.created_at',
    show_title: 'e.title', // fallback if show_title is requested but not available
  };

  const sortColumn = sortColumnMap[sortBy] ?? 'e."order"';
  query += ` ORDER BY ${sortColumn} ${orderBy.toUpperCase()}`;

  const result = await pool.query(query, params);
  return result.rows.map(getEpisodeRow);
}

