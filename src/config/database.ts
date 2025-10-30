import { Pool, PoolConfig } from 'pg';

let pool: Pool | null = null;

export function createPool(config: PoolConfig): Pool {
  if (pool) {
    return pool;
  }
  pool = new Pool(config);
  return pool;
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call createPool first.');
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

