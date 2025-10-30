import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

type ErrorResponse = {
	status: 'error';
	message: string;
	code?: string;
};

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
	if (err instanceof ZodError) {
		const message = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
		return res.status(400).json({ status: 'error', message, code: 'BAD_REQUEST' } satisfies ErrorResponse);
	}

	logger.error({ err }, 'Unhandled error');
	return res.status(500).json({ status: 'error', message: 'Internal server error', code: 'INTERNAL' } satisfies ErrorResponse);
}


