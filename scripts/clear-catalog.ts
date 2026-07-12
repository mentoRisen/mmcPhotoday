import path from "node:path";
import { fileURLToPath } from "node:url";
import { closeDb } from "../src/db";
import {
  formatClearReport,
  runCatalogClear,
} from "../src/import-catalog/clear-catalog";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "DATABASE_URL is not set. Copy .env.example to .env and configure MySQL.",
    );
    process.exit(1);
  }

  try {
    const result = await runCatalogClear({ rootDir });
    console.log(formatClearReport(result));
  } finally {
    await closeDb();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
