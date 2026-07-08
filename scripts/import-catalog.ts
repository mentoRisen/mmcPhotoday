import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatImportReport, hasFailures } from "../src/import-catalog/report";
import { runCatalogImport } from "../src/import-catalog/run-import";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "DATABASE_URL is not set. Copy .env.example to .env and configure MySQL.",
    );
    process.exit(1);
  }

  const baseUrl =
    process.env.CATALOG_BASE_URL?.trim() || "http://localhost:3002";

  const results = await runCatalogImport({ rootDir, baseUrl });
  console.log(formatImportReport(results));

  if (hasFailures(results)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
