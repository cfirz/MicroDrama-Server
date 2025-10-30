import { z } from 'zod';

export const showIdParamSchema = z.object({
	id: z.string().uuid(),
});

export const filterQuerySchema = z.object({
	filterBy: z.enum(['all', 'watched', 'unwatched']).default('all').optional(),
	sortBy: z.enum(['title', 'order', 'created_at']).default('order').optional(),
	orderBy: z.enum(['asc', 'desc']).default('asc').optional(),
});

export const showSchema = z.object({
	id: z.string().uuid(),
	title: z.string(),
	description: z.string().nullable(),
	coverUrl: z.string().nullable(),
	likes: z.number(),
	dislikes: z.number(),
	createdAt: z.any(),
	updatedAt: z.any(),
});

export const episodeWithWatchSchema = z.object({
	id: z.string().uuid(),
	showId: z.string().uuid(),
	title: z.string(),
	order: z.number(),
	muxPlaybackId: z.string(),
	durationSec: z.number(),
	thumbnailUrl: z.string().nullable(),
	createdAt: z.any(),
	updatedAt: z.any(),
	watched: z.boolean(),
});

export const showWithEpisodesSchema = showSchema.extend({
	episodes: z.array(episodeWithWatchSchema),
});


