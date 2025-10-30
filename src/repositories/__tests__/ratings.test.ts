import { Pool } from 'pg';
import { createRating, getRatingCounts } from '../ratings';
import { createPool, closePool } from '../../config/database';

describe('Ratings Repository', () => {
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
    // Clean up in correct order
    await pool.query('DELETE FROM watch_history');
    await pool.query('DELETE FROM ratings');
    await pool.query('DELETE FROM episodes');
    await pool.query('DELETE FROM shows');

    const showResult = await pool.query(
      `INSERT INTO shows (title) VALUES ($1) RETURNING id`,
      ['Test Show']
    );
    showId = showResult.rows[0].id;
  });

  describe('createRating', () => {
    it('should create a like rating', async () => {
      const rating = await createRating(pool, showId, 1);
      expect(rating.showId).toBe(showId);
      expect(rating.ratingValue).toBe(1);
      expect(rating.id).toBeDefined();
    });

    it('should create a dislike rating', async () => {
      const rating = await createRating(pool, showId, 0);
      expect(rating.showId).toBe(showId);
      expect(rating.ratingValue).toBe(0);
    });
  });

  describe('getRatingCounts', () => {
    it('should return zero counts for show with no ratings', async () => {
      const counts = await getRatingCounts(pool, showId);
      expect(counts.likes).toBe(0);
      expect(counts.dislikes).toBe(0);
    });

    it('should return correct counts for multiple ratings', async () => {
      await createRating(pool, showId, 1);
      await createRating(pool, showId, 1);
      await createRating(pool, showId, 0);
      await createRating(pool, showId, 1);

      const counts = await getRatingCounts(pool, showId);
      expect(counts.likes).toBe(3);
      expect(counts.dislikes).toBe(1);
    });
  });
});

