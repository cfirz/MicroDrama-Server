import { z } from 'zod';
import { episodeWithWatchSchema } from './shows.schema';

export const episodesResponseSchema = z.array(episodeWithWatchSchema);


