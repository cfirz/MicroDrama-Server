import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { getMuxClient } from '../src/config/mux';

dotenv.config();

/**
 * Script to list all Mux assets and their playback IDs.
 * Helps identify which playback IDs are available and valid.
 * 
 * Usage:
 *   ts-node scripts/list-mux-assets.ts
 * 
 * Optional: Update database with playback IDs
 *   ts-node scripts/list-mux-assets.ts --update-db
 */

interface MuxAsset {
	id: string;
	status: string;
	playback_ids?: Array<{ id: string; policy: string }>;
	duration?: number;
	created_at?: string;
}

async function listMuxAssets(updateDb: boolean = false) {
	const mux = getMuxClient();
	const pool = new Pool({
		connectionString: process.env.DATABASE_URL,
	});

	try {
		console.log('Fetching assets from Mux...\n');

		// Fetch all assets from Mux
		const response = await mux.video.assets.list({ limit: 100 });
		const assets = response.data as MuxAsset[];

		if (assets.length === 0) {
			console.log('No assets found in Mux account.');
			console.log('Upload some videos to Mux Dashboard first: https://dashboard.mux.com');
			return;
		}

		console.log(`Found ${assets.length} asset(s) in Mux:\n`);
		console.log('='.repeat(80));

		// Display all assets with their playback IDs
		for (const asset of assets) {
			const playbackIds = asset.playback_ids || [];
			const status = asset.status || 'unknown';
			const duration = asset.duration ? `${Math.round(asset.duration)}s` : 'N/A';

			console.log(`\nAsset ID: ${asset.id}`);
			console.log(`Status: ${status}`);
			console.log(`Duration: ${duration}`);

			if (playbackIds.length === 0) {
				console.log('⚠️  No playback IDs found (asset may still be processing)');
			} else {
				console.log('Playback IDs:');
				playbackIds.forEach((pb, idx) => {
					console.log(`  [${idx + 1}] ${pb.id} (policy: ${pb.policy})`);
					console.log(`      Stream URL: https://stream.mux.com/${pb.id}.m3u8`);
				});
			}
			console.log('-'.repeat(80));
		}

		if (updateDb) {
			console.log('\n\nUpdating database with playback IDs...\n');

			// Get all episodes
			const episodesResult = await pool.query(
				`SELECT id, "order", title, show_id, mux_playback_id 
				 FROM episodes 
				 ORDER BY show_id, "order" ASC`
			);

			const episodes = episodesResult.rows;

			if (episodes.length === 0) {
				console.log('No episodes found in database.');
				return;
			}

			// Match assets to episodes (simple round-robin for now)
			const assetsWithPlaybackIds = assets.filter(a => 
				a.playback_ids && a.playback_ids.length > 0 && a.status === 'ready'
			);

			if (assetsWithPlaybackIds.length === 0) {
				console.log('⚠️  No ready assets with playback IDs found.');
				return;
			}

			console.log(`Found ${assetsWithPlaybackIds.length} ready asset(s) with playback IDs.`);
			console.log(`Updating ${episodes.length} episode(s)...\n`);

			let assetIndex = 0;
			let updatedCount = 0;

			for (const episode of episodes) {
				const asset = assetsWithPlaybackIds[assetIndex % assetsWithPlaybackIds.length];
				const playbackId = asset.playback_ids![0].id;
				const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;

				await pool.query(
					`UPDATE episodes 
					 SET mux_playback_id = $1,
					     thumbnail_url = COALESCE(thumbnail_url, $2)
					 WHERE id = $3`,
					[playbackId, thumbnailUrl, episode.id]
				);

				console.log(
					`✓ Updated episode "${episode.title}" (order ${episode.order}): ${playbackId}`
				);

				assetIndex++;
				updatedCount++;
			}

			console.log(`\n✓ Successfully updated ${updatedCount} episode(s)`);
		} else {
			console.log('\n\nTo update database with these playback IDs, run:');
			console.log('  ts-node scripts/list-mux-assets.ts --update-db\n');
			console.log('Or manually update specific episodes:');
			console.log('  UPDATE episodes SET mux_playback_id = \'PLAYBACK_ID_HERE\' WHERE id = \'EPISODE_ID_HERE\';');
		}
	} catch (error: any) {
		console.error('Error:', error.message);
		if (error.response) {
			console.error('Mux API Error:', JSON.stringify(error.response.data, null, 2));
		}
		process.exit(1);
	} finally {
		await pool.end();
	}
}

// CLI execution
const updateDb = process.argv.includes('--update-db');

listMuxAssets(updateDb)
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		console.error('Error:', error.message);
		process.exit(1);
	});

