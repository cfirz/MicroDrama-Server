import { Pool } from 'pg';
import { getAllShows, getShowById } from '../shows';
import { createPool, closePool } from '../../config/database';

describe('Shows Repository', () => {
  let pool: Pool;

  beforeAll(async () => {
    // Initialize pool with test database
    // In a real setup, use a test database URL
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
    // Clean up test data in correct order (respecting foreign key constraints)
    await pool.query('DELETE FROM watch_history');
    await pool.query('DELETE FROM ratings');
    await pool.query('DELETE FROM episodes');
    await pool.query('DELETE FROM shows');
  });

  describe('getAllShows', () => {
    it('should return empty array when no shows exist', async () => {
      const shows = await getAllShows(pool);
      expect(shows).toEqual([]);
    });

    it('should return all shows with computed likes and dislikes', async () => {
      // Insert test show
      const showResult = await pool.query(
        `INSERT INTO shows (title, description) VALUES ($1, $2) RETURNING id`,
        ['Test Show', 'Test Description']
      );
      const showId = showResult.rows[0].id;

      // Insert ratings
      await pool.query(
        `INSERT INTO ratings (show_id, rating_value) VALUES ($1, 1)`,
        [showId]
      );
      await pool.query(
        `INSERT INTO ratings (show_id, rating_value) VALUES ($1, 1)`,
        [showId]
      );
      await pool.query(
        `INSERT INTO ratings (show_id, rating_value) VALUES ($1, 0)`,
        [showId]
      );

      const shows = await getAllShows(pool);
      expect(shows).toHaveLength(1);
      expect(shows[0].title).toBe('Test Show');
      expect(shows[0].likes).toBe(2);
      expect(shows[0].dislikes).toBe(1);
    });
  });

  describe('getShowById', () => {
    it('should return null for non-existent show', async () => {
      const show = await getShowById(pool, '00000000-0000-0000-0000-000000000000');
      expect(show).toBeNull();
    });

    it('should return show with episodes', async () => {
      // Insert test show
      const showResult = await pool.query(
        `INSERT INTO shows (title, description) VALUES ($1, $2) RETURNING id`,
        ['Test Show', 'Test Description']
      );
      const showId = showResult.rows[0].id;

      // Insert episodes
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

      const show = await getShowById(pool, showId);
      expect(show).not.toBeNull();
      expect(show?.title).toBe('Test Show');
      expect(show?.episodes).toHaveLength(2);
      expect(show?.episodes[0].order).toBe(1);
      expect(show?.episodes[1].order).toBe(2);
    });

    it('should include watch status for episodes', async () => {
      // Insert test show and episode
      const showResult = await pool.query(
        `INSERT INTO shows (title) VALUES ($1) RETURNING id`,
        ['Test Show']
      );
      const showId = showResult.rows[0].id;

      const episodeResult = await pool.query(
        `INSERT INTO episodes (show_id, title, "order", mux_playback_id, duration_sec)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [showId, 'Episode 1', 1, 'playback-1', 120]
      );
      const episodeId = episodeResult.rows[0].id;

      // Mark as watched using ON CONFLICT to handle uniqueness constraint
      await pool.query(
        `INSERT INTO watch_history (episode_id, watched) VALUES ($1, true)
         ON CONFLICT (episode_id) DO UPDATE SET watched = true`,
        [episodeId]
      );

      const show = await getShowById(pool, showId);
      expect(show?.episodes[0].watched).toBe(true);
    });
  });
});

