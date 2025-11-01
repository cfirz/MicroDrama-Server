import { Mux } from '@mux/mux-node';
import { loadEnv } from './env';
import { logger } from './logger';

let muxClient: Mux | null = null;

/**
 * Initialize and return Mux client singleton.
 * Uses credentials from validated environment variables.
 */
export function getMuxClient(): Mux {
	if (muxClient) return muxClient;

	const env = loadEnv();
	muxClient = new Mux({
		tokenId: env.MUX_TOKEN_ID,
		tokenSecret: env.MUX_TOKEN_SECRET,
	});

	logger.info('Mux client initialized');
	return muxClient;
}

