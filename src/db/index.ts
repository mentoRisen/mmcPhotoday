import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

type DB = MySql2Database<typeof schema>;

// Reuse the pool across hot-reloads in development to avoid exhausting MySQL
// connections (a known Drizzle + mysql2 pitfall under Next.js HMR).
const globalForDb = globalThis as unknown as {
  pool?: mysql.Pool;
  db?: DB;
};

function createDb(): DB {
  const connectionUri = process.env.DATABASE_URL;
  if (!connectionUri) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and configure the MySQL connection.",
    );
  }

  const pool = globalForDb.pool ?? mysql.createPool({ uri: connectionUri });
  const instance = globalForDb.db ?? drizzle(pool, { schema, mode: "default" });

  globalForDb.pool = pool;
  globalForDb.db = instance;

  return instance;
}

export async function closeDb(): Promise<void> {
  const pool = globalForDb.pool;
  if (!pool) return;

  await pool.end();
  globalForDb.pool = undefined;
  globalForDb.db = undefined;
}

// Lazy proxy: the connection pool is created on first property access (first
// query), not at import time. This keeps `next build` page-data collection from
// requiring a live DATABASE_URL, while runtime queries still connect normally.
export const db: DB = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    const real = globalForDb.db ?? createDb();
    return Reflect.get(real as object, prop, receiver);
  },
});
