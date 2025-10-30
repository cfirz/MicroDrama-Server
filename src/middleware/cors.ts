import cors from 'cors';
import { loadEnv } from '../config/env';

export function corsMiddleware() {
	const env = loadEnv();
	// In development, allow any origin (helps with Expo LAN/Emulator origins)
	if (env.NODE_ENV !== 'production') {
		return cors({ origin: true, credentials: true });
	}
	// In production, restrict to configured origin
	return cors({ origin: env.CORS_ORIGIN, credentials: true });
}


