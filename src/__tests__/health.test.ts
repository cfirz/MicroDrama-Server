import request from 'supertest';
import app from '../server';

describe('GET /api/v1/health', () => {
	it('returns status ok', async () => {
		const res = await request(app).get('/api/v1/health');
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ status: 'ok' });
	});
});


