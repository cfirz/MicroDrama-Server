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

    // Insert sample shows
    const show1Result = await pool.query(
      `INSERT INTO shows (title, description, cover_url) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      [
        'Love in the Office',
        'A romantic drama about two colleagues who discover love in the workplace.',
        'https://example.com/covers/love-office.jpg',
      ]
    );
    const show1Id = show1Result.rows[0].id;

    const show2Result = await pool.query(
      `INSERT INTO shows (title, description, cover_url) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      [
        'Family Secrets',
        'A gripping tale of hidden family secrets that come to light.',
        'https://example.com/covers/family-secrets.jpg',
      ]
    );
    const show2Id = show2Result.rows[0].id;

    const show3Result = await pool.query(
      `INSERT INTO shows (title, description, cover_url) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      [
        'Night Shift',
        'Mystery and intrigue on the night shift at a hospital.',
        null,
      ]
    );
    const show3Id = show3Result.rows[0].id;

    console.log('✓ Inserted shows');

    // Insert episodes for show 1
    const episodes1 = [
      {
        title: 'First Day',
        order: 1,
        muxPlaybackId: 'sample-playback-id-1',
        durationSec: 120,
        thumbnailUrl: 'https://example.com/thumbnails/ep1.jpg',
      },
      {
        title: 'The Encounter',
        order: 2,
        muxPlaybackId: 'sample-playback-id-2',
        durationSec: 90,
        thumbnailUrl: null,
      },
      {
        title: 'Office Gossip',
        order: 3,
        muxPlaybackId: 'sample-playback-id-3',
        durationSec: 110,
        thumbnailUrl: 'https://example.com/thumbnails/ep3.jpg',
      },
    ];

    for (const ep of episodes1) {
      await pool.query(
        `INSERT INTO episodes (show_id, title, "order", mux_playback_id, duration_sec, thumbnail_url)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [show1Id, ep.title, ep.order, ep.muxPlaybackId, ep.durationSec, ep.thumbnailUrl]
      );
    }

    // Insert episodes for show 2
    const episodes2 = [
      {
        title: 'The Beginning',
        order: 1,
        muxPlaybackId: 'sample-playback-id-4',
        durationSec: 100,
        thumbnailUrl: null,
      },
      {
        title: 'Revelation',
        order: 2,
        muxPlaybackId: 'sample-playback-id-5',
        durationSec: 130,
        thumbnailUrl: 'https://example.com/thumbnails/ep5.jpg',
      },
    ];

    for (const ep of episodes2) {
      await pool.query(
        `INSERT INTO episodes (show_id, title, "order", mux_playback_id, duration_sec, thumbnail_url)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [show2Id, ep.title, ep.order, ep.muxPlaybackId, ep.durationSec, ep.thumbnailUrl]
      );
    }

    // Insert episodes for show 3
    const episodes3 = [
      {
        title: 'Midnight Shift',
        order: 1,
        muxPlaybackId: 'sample-playback-id-6',
        durationSec: 95,
        thumbnailUrl: null,
      },
    ];

    for (const ep of episodes3) {
      await pool.query(
        `INSERT INTO episodes (show_id, title, "order", mux_playback_id, duration_sec, thumbnail_url)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [show3Id, ep.title, ep.order, ep.muxPlaybackId, ep.durationSec, ep.thumbnailUrl]
      );
    }

    console.log('✓ Inserted episodes');

    // Insert some ratings
    await pool.query(
      `INSERT INTO ratings (show_id, rating_value) VALUES ($1, $2)`,
      [show1Id, 1]
    );
    await pool.query(
      `INSERT INTO ratings (show_id, rating_value) VALUES ($1, $2)`,
      [show1Id, 1]
    );
    await pool.query(
      `INSERT INTO ratings (show_id, rating_value) VALUES ($1, $2)`,
      [show1Id, 0]
    );
    await pool.query(
      `INSERT INTO ratings (show_id, rating_value) VALUES ($1, $2)`,
      [show2Id, 1]
    );

    console.log('✓ Inserted ratings');

    // Mark some episodes as watched
    const episodeIdsResult = await pool.query(
      `SELECT id FROM episodes WHERE show_id = $1 ORDER BY "order" LIMIT 1`,
      [show1Id]
    );
    if (episodeIdsResult.rows.length > 0) {
      await pool.query(
        `INSERT INTO watch_history (episode_id, watched) VALUES ($1, true)
         ON CONFLICT (episode_id) DO UPDATE SET watched = true`,
        [episodeIdsResult.rows[0].id]
      );
    }

    console.log('✓ Inserted watch history');

    console.log('✓ Database seeding completed');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();

