import { getPool } from '../config/database';
import * as ratingsRepo from '../repositories/ratings';

export async function createRating(showId: string, ratingValue: 0 | 1) {
	const pool = getPool();
	return ratingsRepo.createRating(pool, showId, ratingValue);
}


