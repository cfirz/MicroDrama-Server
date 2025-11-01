import { z } from 'zod';
import dotenv from 'dotenv';

// Ensure .env is loaded before validation
dotenv.config();

const EnvSchema = z.object({
	NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
	PORT: z.coerce.number().int().positive().default(4000),
	DATABASE_URL: z.string().url(),
	JWT_SECRET: z.string().min(1),
	MUX_TOKEN_ID: z.string().min(1),
	MUX_TOKEN_SECRET: z.string().min(1),
	MUX_SIGNING_KEY_ID: z.string().min(1).optional(),
	MUX_SIGNING_KEY_PRIVATE: z.string().min(1).optional(),
	CORS_ORIGIN: z.string().min(1),
});

export type Env = z.infer<typeof EnvSchema>;

let cachedEnv: Env | null = null;

export function loadEnv(): Env {
	if (cachedEnv) return cachedEnv;
	const parsed = EnvSchema.safeParse(process.env);
	if (!parsed.success) {
		throw new Error(`Invalid environment variables: ${parsed.error.message}`);
	}
	cachedEnv = parsed.data;
	return cachedEnv;
}


