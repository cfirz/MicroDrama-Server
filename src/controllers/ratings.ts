import { Request, Response } from 'express';
import * as ratingsService from '../services/ratings';
import { showIdParamSchema } from '../schemas/shows.schema';
import { ratingBodySchema, ratingResponseSchema } from '../schemas/ratings.schema';

export async function createRating(req: Request, res: Response) {
	const params = showIdParamSchema.parse(req.params);
	const body = ratingBodySchema.parse(req.body);
	const rating = await ratingsService.createRating(params.id, body.ratingValue);
	const parsed = ratingResponseSchema.parse(rating);
	return res.status(201).json(parsed);
}


