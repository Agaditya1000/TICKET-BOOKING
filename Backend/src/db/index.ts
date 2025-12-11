// src/db/index.ts
import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

let poolInstance: Pool | null = null;

// Parse and rebuild connection string with decoded password and SSL config
// The pg library requires the password to be a plain string, not URL-encoded
function parseConnectionString(connStr: string) {
  try {
    // Use URL constructor to properly parse connection string with query parameters
    const url = new URL(connStr);
    const password = url.password ? decodeURIComponent(url.password) : '';
    
    // Extract database name (remove leading slash)
    const database = url.pathname.slice(1).split('?')[0];
    
    // Parse query parameters for SSL configuration
    const sslMode = url.searchParams.get('sslmode') || 'require';
    const channelBinding = url.searchParams.get('channel_binding');
    
    // Configure SSL based on sslmode parameter
    let sslConfig: any = false;
    if (sslMode === 'require' || sslMode === 'prefer' || sslMode === 'verify-ca' || sslMode === 'verify-full') {
      sslConfig = {
        rejectUnauthorized: sslMode === 'verify-full' || sslMode === 'verify-ca'
      };
    }
    
    // Build connection config
    const config: any = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: database,
      user: url.username || 'postgres',
      password: password,
    };
    
    // Add SSL config if needed
    if (sslConfig !== false) {
      config.ssl = sslConfig;
    }
    
    return config;
  } catch (urlError: any) {
    // Fallback: try regex parsing for simpler connection strings
    try {
      const match = connStr.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
      
      if (match) {
        const [, user, encodedPassword, host, port, database] = match;
        const password = decodeURIComponent(encodedPassword);
        
        // For Neon and other cloud providers, always use SSL
        return {
          host: host,
          port: parseInt(port, 10),
          database: database,
          user: user,
          password: password,
          ssl: {
            rejectUnauthorized: false // Required for Neon
          }
        };
      }
      
      throw new Error('Connection string format not recognized');
    } catch (regexError) {
      // Last resort: use connection string as-is with SSL
      console.warn('Using connection string directly with SSL enabled');
      return { 
        connectionString: connStr,
        ssl: {
          rejectUnauthorized: false
        }
      };
    }
  }
}

function getPool(): Pool {
  if (!poolInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const config = parseConnectionString(connectionString);
    
    // Validate password is a string
    if ('password' in config && typeof config.password !== 'string') {
      throw new Error('Password must be a string type');
    }
    
    poolInstance = new Pool(config);
  }
  return poolInstance;
}

// Export pool getter for backward compatibility
export const pool = {
  connect: () => getPool().connect(),
  query: (text: string, params?: any) => getPool().query(text, params),
  end: () => getPool().end(),
};

export async function getClient(): Promise<PoolClient> {
  return await getPool().connect();
}

// Default export for serverless functions
export default async function connectDB() {
  try {
    const poolInstance = getPool();
    const client = await poolInstance.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}
