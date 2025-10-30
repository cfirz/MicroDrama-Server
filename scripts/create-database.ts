import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function createDatabase() {
  // Connect to default postgres database to create the target database
  const defaultUrl = process.env.DATABASE_URL || 'postgres://postgres:zana1606@localhost:5432/postgres';
  
  // Extract connection info from DATABASE_URL
  const url = new URL(defaultUrl.replace('postgres://', 'http://'));
  const connectionUrl = `postgres://${url.username}:${url.password}@${url.hostname}:${url.port || '5432'}/postgres`;
  
  const pool = new Pool({
    connectionString: connectionUrl,
  });

  try {
    const databaseName = 'microdrama';
    
    // Check if database exists
    const checkResult = await pool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName]
    );

    if (checkResult.rows.length > 0) {
      console.log(`Database '${databaseName}' already exists`);
      return;
    }

    // Create database
    await pool.query(`CREATE DATABASE ${databaseName}`);
    console.log(`✓ Database '${databaseName}' created successfully`);
  } catch (error: any) {
    if (error.code === '42P04') {
      console.log('Database already exists');
    } else {
      console.error('Failed to create database:', error.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

createDatabase();

