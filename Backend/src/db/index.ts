// src/db/index.ts
import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) throw new Error('DATABASE_URL not set');

// Parse and rebuild connection string with decoded password
// The pg library requires the password to be a plain string, not URL-encoded
function parseConnectionString(connStr: string) {
  try {
    // Parse the connection string
    const match = connStr.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
    
    if (match) {
      const [, user, encodedPassword, host, port, database] = match;
      
      // Decode the URL-encoded password
      const password = decodeURIComponent(encodedPassword);
      
      // Use individual connection parameters (pg handles this better than connection strings with special chars)
      return {
        host: host,
        port: parseInt(port, 10),
        database: database,
        user: user,
        password: password, // Decoded password as plain string
      };
    }
    
    throw new Error('Connection string format not recognized');
  } catch (error: any) {
    // If parsing fails, try to use URL constructor
    try {
      const url = new URL(connStr);
      const password = url.password ? decodeURIComponent(url.password) : '';
      
      return {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1),
        user: url.username || 'postgres',
        password: password,
      };
    } catch (urlError) {
      // Last resort: use connection string as-is
      console.warn('Using connection string directly (may fail with special characters)');
      return { connectionString: connStr };
    }
  }
}

const config = parseConnectionString(connectionString);

// Validate password is a string
if ('password' in config && typeof config.password !== 'string') {
  throw new Error('Password must be a string type');
}

export const pool = new Pool(config);

export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}
