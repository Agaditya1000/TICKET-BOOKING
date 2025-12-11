// src/db/index.ts
import { Pool, PoolClient } from "pg";
import dotenv from "dotenv";
dotenv.config();

let poolInstance: Pool | null = null;

function buildPoolConfig() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not set");

  return {
    connectionString,
    ssl: {
      rejectUnauthorized: false  
    }
  };
}

function getPool(): Pool {
  if (!poolInstance) {
    poolInstance = new Pool(buildPoolConfig());

    console.log(
      `DB pool created (host: ${
        new URL(process.env.DATABASE_URL!).hostname
      }, sslMode: rejectUnauthorized:false)`
    );

    poolInstance.on("error", (err) => {
      console.error("Unexpected error on idle PG client", err);
    });
  }
  return poolInstance;
}

export const pool = {
  connect: async (): Promise<PoolClient> => getPool().connect(),
  query: async (text: string, params?: any) => getPool().query(text, params),
  end: async () => getPool().end()
};

export async function getClient(): Promise<PoolClient> {
  return await getPool().connect();
}

export default async function connectDB(): Promise<void> {
  try {
    const client = await getPool().connect();
    try {
      await client.query("SELECT NOW()");
      console.log("✅ Database connection successful");
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
}
