import { migrate } from "drizzle-orm/mysql2/migrator";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  const connection = await mysql.createConnection(url);
  const db = drizzle(connection);

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations applied successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

void main();
