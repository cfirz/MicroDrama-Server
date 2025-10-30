import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Create migrations table to track applied migrations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get migrations directory relative to this script
    const migrationsDir = join(process.cwd(), 'migrations');
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const match = file.match(/^(\d+)_/);
      if (!match) {
        console.warn(`Skipping ${file}: invalid naming format`);
        continue;
      }

      const version = parseInt(match[1], 10);

      // Check if migration already applied
      const result = await pool.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [version]
      );

      if (result.rows.length > 0) {
        console.log(`Migration ${version} (${file}) already applied, skipping`);
        continue;
      }

      // Read and execute migration
      const migrationPath = join(migrationsDir, file);
      const migrationSQL = readFileSync(migrationPath, 'utf-8');

      console.log(`Applying migration ${version}: ${file}`);
      await pool.query('BEGIN');
      try {
        await pool.query(migrationSQL);
        await pool.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
        await pool.query('COMMIT');
        console.log(`✓ Migration ${version} applied successfully`);
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    }

    console.log('All migrations completed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

