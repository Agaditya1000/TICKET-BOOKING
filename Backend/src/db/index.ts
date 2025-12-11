// src/db/index.ts
import { Pool, PoolClient, PoolConfig } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

let poolInstance: Pool | null = null;

/**
 * Interpret PGSSLMODE:
 *  - "disable"  => no ssl option
 *  - "require"  => ssl with verification (rejectUnauthorized: true)
 *  - "no-verify"=> ssl and accept self-signed (rejectUnauthorized: false)
 *
 * If PGSSLMODE is not set, we default to:
 *  - rejectUnauthorized: false  when NODE_ENV !== 'production' (developer convenience)
 *  - rejectUnauthorized: true   when NODE_ENV === 'production'
 */
function makeSslOptionFromEnv(): PoolConfig['ssl'] | undefined {
  const sslMode = (process.env.PGSSLMODE || '').toLowerCase();
  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();

  if (sslMode === 'disable') return undefined;
  if (sslMode === 'no-verify') return { rejectUnauthorized: false } as any;
  if (sslMode === 'require') return { rejectUnauthorized: true } as any;

  // No explicit PGSSLMODE set -> choose sensible default:
  // - development: accept self-signed (convenience)
  // - production: strict verification
  if (nodeEnv === 'production') return { rejectUnauthorized: true } as any;
  return { rejectUnauthorized: false } as any;
}

function parseConnectionString(connStr: string): PoolConfig | { connectionString: string } {
  try {
    const match = connStr.match(/^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:\/]+):(\d+)\/(.+)$/);

    if (match) {
      const [, user, encodedPassword, host, port, database] = match;
      const password = decodeURIComponent(encodedPassword);

      const config: PoolConfig = {
        host,
        port: parseInt(port, 10),
        database,
        user,
        password,
      };

      const sslOpt = makeSslOptionFromEnv();
      if (sslOpt !== undefined) (config as any).ssl = sslOpt;
      return config;
    }

    // fallback to URL
    const url = new URL(connStr);
    const password = url.password ? decodeURIComponent(url.password) : '';

    const configFromUrl: PoolConfig = {
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 5432,
      database: url.pathname ? url.pathname.slice(1) : undefined,
      user: url.username || undefined,
      password,
    };

    const sslOpt = makeSslOptionFromEnv();
    if (sslOpt !== undefined) (configFromUrl as any).ssl = sslOpt;
    return configFromUrl;
  } catch (err) {
    console.warn('parseConnectionString fallback to raw conn string. Error:', (err as Error).message);
    return { connectionString: connStr };
  }
}

function getPool(): Pool {
  if (!poolInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL environment variable is not set');

    const configOrConnStr = parseConnectionString(connectionString);

    // Create pool with either config object or connectionString
    poolInstance =
      configOrConnStr && 'connectionString' in configOrConnStr
        ? new Pool({ connectionString: (configOrConnStr as any).connectionString } as PoolConfig)
        : new Pool(configOrConnStr as PoolConfig);

    const sslMode = process.env.PGSSLMODE || (process.env.NODE_ENV === 'production' ? 'require' : 'no-verify');
    const hostInfo = (configOrConnStr as any).host || 'via connectionString';
    console.log(`DB pool created (host: ${hostInfo}, sslMode: ${sslMode})`);

    poolInstance.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return poolInstance;
}

// Export simple pool API
export const pool = {
  connect: async (): Promise<PoolClient> => getPool().connect(),
  query: async (text: string, params?: any) => getPool().query(text, params),
  end: async () => getPool().end(),
};

export async function getClient(): Promise<PoolClient> {
  return await getPool().connect();
}

export default async function connectDB(): Promise<void> {
  try {
    const poolInstance = getPool();
    const client = await poolInstance.connect();
    try {
      await client.query('SELECT NOW()');
      console.log('✅ Database connection successful');
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message || error);
    throw error;
  }
}
