import { getPool } from '../config/database';
import * as showsRepo from '../repositories/shows';
import * as episodesRepo from '../repositories/episodes';
import { FilterOptions, SortOptions } from '../types/filters';
import { signMuxPlaybackUrl } from '../utils/muxSigning';

export async function getAllShows() {
	const pool = getPool();
	return showsRepo.getAllShows(pool);
}

export async function getShowById(id: string) {
	const pool = getPool();
	const show = await showsRepo.getShowById(pool, id);
	if (!show) return null;
	
	// Add signed playback URLs to episodes
	return {
		...show,
		episodes: show.episodes.map(episode => ({
			...episode,
			muxPlaybackUrl: signMuxPlaybackUrl(episode.muxPlaybackId),
		})),
	};
}

export async function getShowEpisodes(
	showId: string,
	filters?: FilterOptions,
	sortOptions?: SortOptions
) {
	const pool = getPool();
	const episodes = await episodesRepo.getEpisodesByShowId(pool, showId, filters, sortOptions);
	
	// Add signed playback URLs to each episode
	return episodes.map(episode => ({
		...episode,
		muxPlaybackUrl: signMuxPlaybackUrl(episode.muxPlaybackId),
	}));
}


