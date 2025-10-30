import cors from 'cors';
import { loadEnv } from '../config/env';

export function corsMiddleware() {
	const env = loadEnv();
	return cors({
		origin: env.CORS_ORIGIN,
		credentials: true,
	});
}


