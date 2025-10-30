import pinoHttp from 'pino-http';
import { logger } from '../config/logger';

export function requestLogger() {
	return pinoHttp({
		logger,
		autoLogging: true,
		transport: undefined,
	});
}


