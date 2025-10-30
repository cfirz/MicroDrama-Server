import { Request, Response } from 'express';
import * as showsService from '../services/shows';
import { filterQuerySchema, showIdParamSchema, showSchema, showWithEpisodesSchema } from '../schemas/shows.schema';
import { episodesResponseSchema } from '../schemas/episodes.schema';

export async function getAllShows(_req: Request, res: Response) {
	const shows = await showsService.getAllShows();
	const parsed = showSchema.array().parse(shows);
	return res.json(parsed);
}

export async function getShowById(req: Request, res: Response) {
	const params = showIdParamSchema.parse(req.params);
	const show = await showsService.getShowById(params.id);
	if (!show) return res.status(404).json({ status: 'error', message: 'Show not found' });
	const parsed = showWithEpisodesSchema.parse(show);
	return res.json(parsed);
}

export async function getShowEpisodes(req: Request, res: Response) {
	const params = showIdParamSchema.parse(req.params);
	const query = filterQuerySchema.parse(req.query);
	const episodes = await showsService.getShowEpisodes(params.id, query, query);
	const parsed = episodesResponseSchema.parse(episodes);
	return res.json(parsed);
}


