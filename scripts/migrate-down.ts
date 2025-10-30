import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function rollbackMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Get last applied migration
    const result = await pool.query(
      'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const version = result.rows[0].version;
    console.log(`Rolling back migration ${version}`);

    // Drop tables in reverse order
    await pool.query('DROP TABLE IF EXISTS watch_history CASCADE');
    await pool.query('DROP TABLE IF EXISTS ratings CASCADE');
    await pool.query('DROP TABLE IF EXISTS episodes CASCADE');
    await pool.query('DROP TABLE IF EXISTS shows CASCADE');

    // Remove migration record
    await pool.query('DELETE FROM schema_migrations WHERE version = $1', [version]);

    console.log(`✓ Migration ${version} rolled back`);
  } catch (error) {
    console.error('Rollback failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

rollbackMigration();

