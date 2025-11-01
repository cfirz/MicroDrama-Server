import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Helper script to update ALL episodes with real Mux playback IDs.
 * Randomly assigns one of the two provided playback IDs to each episode.
 * 
 * Usage:
 *   ts-node scripts/update-mux-playback-ids.ts
 */

// Hardcoded Mux playback IDs
const PLAYBACK_IDS = [
	'a3DkBb0158YW8MDmL7i7GdosO02D802jofpdwtZJCUSj400',
	'AAshRZ701SPDiN6cJa3D3tjV5MEypbK3iTk2ff5xQap00',
];

/**
 * Randomly selects one of the playback IDs
 */
function getRandomPlaybackId(): string {
	return PLAYBACK_IDS[Math.floor(Math.random() * PLAYBACK_IDS.length)];
}

async function updateAllEpisodesWithMuxPlaybackIds() {
	const pool = new Pool({
		connectionString: process.env.DATABASE_URL,
	});

	try {
		console.log(`Updating all episodes with randomly assigned playback IDs...`);
		console.log(`Available playback IDs: ${PLAYBACK_IDS.join(', ')}\n`);

		// Get all episodes from the database
		const episodesResult = await pool.query(
			`SELECT id, "order", show_id FROM episodes ORDER BY show_id, "order" ASC`
		);

		const episodes = episodesResult.rows;

		if (episodes.length === 0) {
			console.log('No episodes found in database.');
			return;
		}

		console.log(`Found ${episodes.length} episodes to update.\n`);

		// Track assignment counts
		const assignmentCounts = new Map<string, number>();
		PLAYBACK_IDS.forEach(id => assignmentCounts.set(id, 0));

		for (const episode of episodes) {
			const playbackId = getRandomPlaybackId();
			assignmentCounts.set(playbackId, (assignmentCounts.get(playbackId) || 0) + 1);

			const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;

			await pool.query(
				`UPDATE episodes 
				 SET mux_playback_id = $1, 
				     thumbnail_url = COALESCE(thumbnail_url, $2)
				 WHERE id = $3`,
				[playbackId, thumbnailUrl, episode.id]
			);

			console.log(`✓ Updated episode ${episode.order} (show ${episode.show_id}): ${playbackId}`);
		}

		console.log(`\n✓ Successfully updated ${episodes.length} episodes`);
		console.log('\nAssignment summary:');
		assignmentCounts.forEach((count, id) => {
			console.log(`  ${id}: ${count} episodes`);
		});
	} catch (error: any) {
		console.error('Update failed:', error.message);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

// CLI execution
if (require.main === module) {
	updateAllEpisodesWithMuxPlaybackIds()
		.then(() => {
			process.exit(0);
		})
		.catch((error) => {
			console.error('Error:', error.message);
			process.exit(1);
		});
}

export { updateAllEpisodesWithMuxPlaybackIds };

