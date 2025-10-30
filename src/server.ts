import express from 'express';
import { createPool } from './config/database';
import { loadEnv } from './config/env';
import { logger } from './config/logger';
import { helmetMiddleware } from './middleware/helmet';
import { corsMiddleware } from './middleware/cors';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health.routes';
import showsRoutes from './routes/shows.routes';
import ratingsRoutes from './routes/ratings.routes';

const env = loadEnv();

// Initialize DB pool early
createPool({ connectionString: env.DATABASE_URL });

const app = express();

app.use(helmetMiddleware());
app.use(corsMiddleware());
app.use(express.json());
app.use(requestLogger());

app.use('/api/v1', healthRoutes);
app.use('/api/v1', showsRoutes);
app.use('/api/v1', ratingsRoutes);

app.use(errorHandler);

if (require.main === module) {
	app.listen(env.PORT, () => {
		logger.info({ port: env.PORT }, 'Server listening');
	});
}

export default app;


