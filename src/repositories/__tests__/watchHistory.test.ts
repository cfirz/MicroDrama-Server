import { Pool } from 'pg';
import { markEpisodeAsWatched, getWatchStatus } from '../watchHistory';
import { createPool, closePool } from '../../config/database';

describe('Watch History Repository', () => {
  let pool: Pool;
  let showId: string;
  let episodeId: string;

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
    // Clean up in correct order (respecting foreign key constraints)
    await pool.query('DELETE FROM watch_history');
    await pool.query('DELETE FROM ratings');
    await pool.query('DELETE FROM episodes');
    await pool.query('DELETE FROM shows');

    const showResult = await pool.query(
      `INSERT INTO shows (title) VALUES ($1) RETURNING id`,
      ['Test Show']
    );
    showId = showResult.rows[0].id;

    const episodeResult = await pool.query(
      `INSERT INTO episodes (show_id, title, "order", mux_playback_id, duration_sec)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [showId, 'Episode 1', 1, 'playback-1', 120]
    );
    episodeId = episodeResult.rows[0].id;
  });

  describe('markEpisodeAsWatched', () => {
    it('should mark episode as watched', async () => {
      const watchHistory = await markEpisodeAsWatched(pool, episodeId);
      expect(watchHistory.episodeId).toBe(episodeId);
      expect(watchHistory.watched).toBe(true);
    });

    it('should update existing watch history if already exists', async () => {
      await markEpisodeAsWatched(pool, episodeId);
      const watchHistory = await markEpisodeAsWatched(pool, episodeId);
      expect(watchHistory.watched).toBe(true);
    });
  });

  describe('getWatchStatus', () => {
    it('should return false for unwatched episode', async () => {
      const watched = await getWatchStatus(pool, episodeId);
      expect(watched).toBe(false);
    });

    it('should return true for watched episode', async () => {
      await markEpisodeAsWatched(pool, episodeId);
      const watched = await getWatchStatus(pool, episodeId);
      expect(watched).toBe(true);
    });
  });
});

