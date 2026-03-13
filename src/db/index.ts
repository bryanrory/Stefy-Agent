import { Pool, QueryResult, QueryResultRow } from "pg";
import { env } from "../config/env";
import { logger } from "../config/logger";

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function connectDatabase(): Promise<void> {
  try {
    const result = await pool.query("SELECT NOW()");
    logger.info(`PostgreSQL connected — ${result.rows[0].now}`);
  } catch (err) {
    logger.error(err, "Failed to connect to PostgreSQL");
    process.exit(1);
  }
}
