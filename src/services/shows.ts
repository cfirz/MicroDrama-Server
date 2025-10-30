import { getPool } from '../config/database';
import * as showsRepo from '../repositories/shows';
import * as episodesRepo from '../repositories/episodes';
import { FilterOptions, SortOptions } from '../types/filters';

export async function getAllShows() {
	const pool = getPool();
	return showsRepo.getAllShows(pool);
}

export async function getShowById(id: string) {
	const pool = getPool();
	return showsRepo.getShowById(pool, id);
}

export async function getShowEpisodes(
	showId: string,
	filters?: FilterOptions,
	sortOptions?: SortOptions
) {
	const pool = getPool();
	return episodesRepo.getEpisodesByShowId(pool, showId, filters, sortOptions);
}


