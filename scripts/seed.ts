import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Seeding database...');

    // Clean existing data (optional - comment out if you want to keep existing data)
    await pool.query('DELETE FROM watch_history');
    await pool.query('DELETE FROM ratings');
    await pool.query('DELETE FROM episodes');
    await pool.query('DELETE FROM shows');

    // Generate 20 shows, each with 50 episodes
    const showIds: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const title = `Show ${i.toString().padStart(2, '0')}`;
      const desc = `Auto-generated description for ${title}.`;
      const cover = i % 3 === 0 ? null : `https://picsum.photos/seed/show_${i}/300/450`;
      const res = await pool.query(
        `INSERT INTO shows (title, description, cover_url) VALUES ($1, $2, $3) RETURNING id`,
        [title, desc, cover]
      );
      showIds.push(res.rows[0].id);
    }

    console.log('✓ Inserted 20 shows');

    for (let s = 0; s < showIds.length; s++) {
      const showId = showIds[s];
      for (let e = 1; e <= 50; e++) {
        const epTitle = `Episode ${e.toString().padStart(2, '0')}`;
        const muxId = `mux-playback-${s + 1}-${e}`;
        const duration = 60 + ((s + e) % 60); // 60-119 seconds
        const thumb = e % 4 === 0 ? null : `https://picsum.photos/seed/ep_${s + 1}_${e}/200/300`;
        await pool.query(
          `INSERT INTO episodes (show_id, title, "order", mux_playback_id, duration_sec, thumbnail_url)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [showId, epTitle, e, muxId, duration, thumb]
        );
      }
    }

    console.log('✓ Inserted 1000 episodes');

    // Insert simple ratings distribution to simulate likes
    for (let idx = 0; idx < showIds.length; idx++) {
      const showId = showIds[idx];
      const likes = 5 + (idx % 10);
      const dislikes = idx % 3;
      for (let l = 0; l < likes; l++) {
        await pool.query(`INSERT INTO ratings (show_id, rating_value) VALUES ($1, 1)`, [showId]);
      }
      for (let d = 0; d < dislikes; d++) {
        await pool.query(`INSERT INTO ratings (show_id, rating_value) VALUES ($1, 0)`, [showId]);
      }
    }

    console.log('✓ Inserted synthetic ratings');

    // Mark the first episode of the first show as watched to test watch history
    const firstEp = await pool.query(
      `SELECT id FROM episodes WHERE show_id = $1 ORDER BY "order" LIMIT 1`,
      [showIds[0]]
    );
    if (firstEp.rows.length > 0) {
      await pool.query(
        `INSERT INTO watch_history (episode_id, watched) VALUES ($1, true)
         ON CONFLICT (episode_id) DO UPDATE SET watched = true`,
        [firstEp.rows[0].id]
      );
    }

    console.log('✓ Inserted sample watch history');

    console.log('✓ Database seeding completed');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();

