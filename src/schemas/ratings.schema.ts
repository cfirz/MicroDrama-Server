import { z } from 'zod';

export const ratingBodySchema = z.object({
	ratingValue: z.union([z.literal(0), z.literal(1)]),
});

export const ratingResponseSchema = z.object({
	id: z.string().uuid(),
	showId: z.string().uuid(),
	ratingValue: z.union([z.literal(0), z.literal(1)]),
	createdAt: z.any(),
});


