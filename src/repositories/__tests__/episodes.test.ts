import { Pool } from 'pg';
import { getEpisodesByShowId } from '../episodes';
import { createPool, closePool } from '../../config/database';
import { FilterOptions, SortOptions } from '../../types/filters';

describe('Episodes Repository', () => {
  let pool: Pool;
  let showId: string;

  beforeAll(async () => {
    const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL or TEST_DATABASE_URL must be set');
    }
    pool = createPool({ connectionString: databaseUrl });
  });

  afterAll(async () => {
    await closePool();
  });

  beforeEach(async () => {
    // Clean up and create test data (correct order for foreign keys)
    await pool.query('DELETE FROM watch_history');
    await pool.query('DELETE FROM ratings');
    await pool.query('DELETE FROM episodes');
    await pool.query('DELETE FROM shows');

    const showResult = await pool.query(
      `INSERT INTO shows (title) VALUES ($1) RETURNING id`,
      ['Test Show']
    );
    showId = showResult.rows[0].id;

    // Insert test episodes
    await pool.query(
      `INSERT INTO episodes (show_id, title, "order", mux_playback_id, duration_sec)
       VALUES ($1, $2, $3, $4, $5)`,
      [showId, 'Episode 1', 1, 'playback-1', 120]
    );
    await pool.query(
      `INSERT INTO episodes (show_id, title, "order", mux_playback_id, duration_sec)
       VALUES ($1, $2, $3, $4, $5)`,
      [showId, 'Episode 2', 2, 'playback-2', 90]
    );
    await pool.query(
      `INSERT INTO episodes (show_id, title, "order", mux_playback_id, duration_sec)
       VALUES ($1, $2, $3, $4, $5)`,
      [showId, 'Episode 3', 3, 'playback-3', 110]
    );
  });

  describe('getEpisodesByShowId', () => {
    it('should return all episodes for a show', async () => {
      const episodes = await getEpisodesByShowId(pool, showId);
      expect(episodes).toHaveLength(3);
      expect(episodes[0].order).toBe(1);
      expect(episodes[1].order).toBe(2);
      expect(episodes[2].order).toBe(3);
    });

    it('should filter by watched episodes', async () => {
      // Get episode IDs (they were created in beforeEach)
      const episodeResult = await pool.query(
        `SELECT id FROM episodes WHERE show_id = $1 ORDER BY "order"`,
        [showId]
      );
      expect(episodeResult.rows.length).toBeGreaterThanOrEqual(2);
      const episode1Id = episodeResult.rows[0].id;
      const episode2Id = episodeResult.rows[1].id;

      // Mark first two as watched using ON CONFLICT to handle uniqueness constraint
      await pool.query(
        `INSERT INTO watch_history (episode_id, watched) VALUES ($1, true)
         ON CONFLICT (episode_id) DO UPDATE SET watched = true`,
        [episode1Id]
      );
      await pool.query(
        `INSERT INTO watch_history (episode_id, watched) VALUES ($1, true)
         ON CONFLICT (episode_id) DO UPDATE SET watched = true`,
        [episode2Id]
      );

      const filterOptions: FilterOptions = { filterBy: 'watched' };
      const episodes = await getEpisodesByShowId(pool, showId, filterOptions);
      expect(episodes.length).toBeGreaterThanOrEqual(2);
      expect(episodes.every((ep) => ep.watched)).toBe(true);
    });

    it('should filter by unwatched episodes', async () => {
      const episodeResult = await pool.query(
        `SELECT id FROM episodes WHERE show_id = $1 ORDER BY "order" LIMIT 1`,
        [showId]
      );
      const episodeId = episodeResult.rows[0].id;

      // Mark one as watched
      await pool.query(
        `INSERT INTO watch_history (episode_id, watched) VALUES ($1, true)`,
        [episodeId]
      );

      const filterOptions: FilterOptions = { filterBy: 'unwatched' };
      const episodes = await getEpisodesByShowId(pool, showId, filterOptions);
      expect(episodes).toHaveLength(2);
      expect(episodes.every((ep) => !ep.watched)).toBe(true);
    });

    it('should sort by title', async () => {
      const sortOptions: SortOptions = { sortBy: 'title', orderBy: 'asc' };
      const episodes = await getEpisodesByShowId(pool, showId, undefined, sortOptions);
      expect(episodes[0].title).toBe('Episode 1');
      expect(episodes[1].title).toBe('Episode 2');
      expect(episodes[2].title).toBe('Episode 3');
    });

    it('should sort by order descending', async () => {
      const sortOptions: SortOptions = { sortBy: 'order', orderBy: 'desc' };
      const episodes = await getEpisodesByShowId(pool, showId, undefined, sortOptions);
      expect(episodes[0].order).toBe(3);
      expect(episodes[1].order).toBe(2);
      expect(episodes[2].order).toBe(1);
    });
  });
});

