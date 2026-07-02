import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const connectionUri = process.env.DATABASE_URL;

if (!connectionUri) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and configure the MySQL connection.",
  );
}

// Reuse the pool across hot-reloads in development to avoid exhausting MySQL
// connections (a known Drizzle + mysql2 pitfall under Next.js HMR).
const globalForDb = globalThis as unknown as {
  pool?: mysql.Pool;
  db?: MySql2Database<typeof schema>;
};

const pool = globalForDb.pool ?? mysql.createPool({ uri: connectionUri });

export const db: MySql2Database<typeof schema> =
  globalForDb.db ?? drizzle(pool, { schema, mode: "default" });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
  globalForDb.db = db;
}
