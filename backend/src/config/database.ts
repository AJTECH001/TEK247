import { Pool, PoolClient, types } from "pg";
import { env } from "./env";

// Parse BIGSERIAL/int8 columns as JavaScript numbers instead of strings
types.setTypeParser(20, (val: string) => parseInt(val, 10));

// Railway provides DATABASE_URL as a single connection string.
// Local dev uses individual DB_* variables from .env.
export const pool = env.DATABASE_URL
  ? new Pool({
      connectionString: env.DATABASE_URL,
      // Railway PostgreSQL requires SSL in production
      ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  : new Pool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
  process.exit(1);
});

export async function connectDB(): Promise<void> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query("SELECT NOW()");
    console.log("✅  PostgreSQL connected");
  } finally {
    client.release();
  }
}

export async function query<T extends object>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}
