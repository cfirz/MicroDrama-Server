import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Testing PostgreSQL connection...\n');

    // Test 1: Basic connection
    const result = await pool.query('SELECT NOW() as current_time, current_database() as database_name, version() as version');
    console.log('✓ Connection successful!');
    console.log(`  Database: ${result.rows[0].database_name}`);
    console.log(`  Server Time: ${result.rows[0].current_time}`);
    console.log(`  PostgreSQL Version: ${result.rows[0].version.split('\n')[0]}\n`);

    // Test 2: List tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('✓ Available tables:');
    tablesResult.rows.forEach((row: any) => {
      console.log(`  - ${row.table_name}`);
    });
    console.log('');

    // Test 3: Count records
    const counts = await pool.query(`
      SELECT 
        'shows' as table_name, COUNT(*) as row_count FROM shows
      UNION ALL
      SELECT 'episodes', COUNT(*) FROM episodes
      UNION ALL
      SELECT 'ratings', COUNT(*) FROM ratings
      UNION ALL
      SELECT 'watch_history', COUNT(*) FROM watch_history
    `);
    console.log('✓ Table row counts:');
    counts.rows.forEach((row: any) => {
      console.log(`  ${row.table_name}: ${row.row_count} rows`);
    });

    console.log('\n✅ All connection tests passed!');
  } catch (error: any) {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();

