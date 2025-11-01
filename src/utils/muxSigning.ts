import crypto from 'crypto';
import { loadEnv } from '../config/env';

/**
 * Signs a Mux playback URL using JWT.
 * 
 * For signed playback policies, Mux requires a JWT token with:
 * Header:
 * - alg: "RS256"
 * - kid: signing key ID
 * Payload:
 * - sub: playback ID
 * - exp: expiration (UNIX timestamp)
 * - aud: "v" for video playback
 * 
 * The token must be signed using RS256 algorithm with the private key.
 * 
 * @param playbackId The Mux playback ID
 * @param expirationSeconds Optional expiration in seconds from now (default: 7 days)
 * @returns Signed playback URL with token query parameter
 */
export function signMuxPlaybackUrl(playbackId: string, expirationSeconds: number = 7 * 24 * 60 * 60): string {
	const env = loadEnv();

	// If signing keys are not configured, return unsigned URL (for public playback policies)
	if (!env.MUX_SIGNING_KEY_ID || !env.MUX_SIGNING_KEY_PRIVATE) {
		return `https://stream.mux.com/${playbackId}.m3u8`;
	}

	try {
		// Decode base64 private key
		const privateKey = Buffer.from(env.MUX_SIGNING_KEY_PRIVATE, 'base64').toString('utf-8');

		// Create JWT header
		const header = {
			alg: 'RS256',
			kid: env.MUX_SIGNING_KEY_ID,
		};

		// Create JWT payload
		const now = Math.floor(Date.now() / 1000);
		const payload = {
			sub: playbackId,
			exp: now + expirationSeconds,
			aud: 'v',
		};

		// Encode header and payload
		const encodedHeader = base64UrlEncode(JSON.stringify(header));
		const encodedPayload = base64UrlEncode(JSON.stringify(payload));

		// Create signature
		const signatureInput = `${encodedHeader}.${encodedPayload}`;
		const signatureBase64 = crypto
			.createSign('RSA-SHA256')
			.update(signatureInput)
			.sign(privateKey, 'base64');
		// Convert base64 signature to base64url (replace chars, remove padding)
		const encodedSignature = signatureBase64
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');

		// Create JWT token
		const token = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;

		// Return signed URL
		return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
	} catch (error) {
		// If signing fails, return unsigned URL (fallback for public policies)
		console.error('[MuxSigning] Failed to sign URL:', error);
		return `https://stream.mux.com/${playbackId}.m3u8`;
	}
}

/**
 * Base64 URL-safe encoding (replaces + with -, / with _, and removes padding)
 */
function base64UrlEncode(str: string): string {
	return Buffer.from(str)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

