import type { ImportResult } from "./types";

export function formatImportReport(results: ImportResult[]): string {
  if (results.length === 0) {
    return "No JSON files found in import folders.";
  }

  const lines = ["Catalog import summary:", ""];
  for (const result of results) {
    const label = result.message ? `: ${result.message}` : "";
    lines.push(
      `  [${result.status.toUpperCase()}] ${result.entityType}/${result.fileName}${label}`,
    );
  }

  const created = results.filter((r) => r.status === "created").length;
  const updated = results.filter((r) => r.status === "updated").length;
  const failed = results.filter((r) => r.status === "failed").length;

  lines.push("");
  lines.push(
    `Total: ${created} created, ${updated} updated, ${failed} failed`,
  );

  return lines.join("\n");
}

export function hasFailures(results: ImportResult[]): boolean {
  return results.some((r) => r.status === "failed");
}
