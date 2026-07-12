import { closeDb } from "../src/db";
import {
  sendPhotographerInvitationById,
  sendPhotographerInvitationsToAll,
  type SendInvitationResult,
} from "../src/db/photographer-invitations";

function usage(): never {
  console.error(`Usage:
  npm run photographers:send-invitations -- --all [--force] [--dry-run]
  npm run photographers:send-invitations -- --id=<photographerId> [--force] [--dry-run]

Options:
  --all       Send to all photographers (skips those already invited unless --force)
  --id=N      Send to one photographer by id
  --force     Re-send even when invitation was already sent
  --dry-run   Print who would receive mail without sending`);
  process.exit(1);
}

function parseArgs(argv: string[]) {
  const all = argv.includes("--all");
  const force = argv.includes("--force");
  const dryRun = argv.includes("--dry-run");
  const idArg = argv.find((arg) => arg.startsWith("--id="));
  const id = idArg ? Number.parseInt(idArg.slice("--id=".length), 10) : undefined;

  if (all && id !== undefined) {
    console.error("Use either --all or --id=, not both.");
    usage();
  }

  if (!all && (id === undefined || Number.isNaN(id))) {
    usage();
  }

  return { all, force, dryRun, id };
}

function printResult(result: SendInvitationResult): void {
  switch (result.status) {
    case "sent":
      console.log(
        `[sent] #${result.photographerId} ${result.name} <${result.email}>`,
      );
      break;
    case "dry_run":
      console.log(
        `[dry-run] #${result.photographerId} ${result.name} <${result.email}>`,
      );
      break;
    case "skipped":
      console.log(
        `[skip] #${result.photographerId} ${result.name} — ${result.reason}`,
      );
      break;
    case "failed":
      console.error(
        `[failed] #${result.photographerId} ${result.name} — ${result.error}`,
      );
      break;
  }
}

function summarize(results: SendInvitationResult[]): number {
  const sent = results.filter((r) => r.status === "sent").length;
  const dryRun = results.filter((r) => r.status === "dry_run").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log("");
  console.log(
    `Summary: ${sent} sent, ${dryRun} dry-run, ${skipped} skipped, ${failed} failed`,
  );

  return failed > 0 ? 1 : 0;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "DATABASE_URL is not set. Copy .env.example to .env and configure MySQL.",
    );
    process.exit(1);
  }

  const { all, force, dryRun, id } = parseArgs(process.argv.slice(2));
  let exitCode = 0;

  try {
    if (all) {
      const results = await sendPhotographerInvitationsToAll({ force, dryRun });
      for (const result of results) {
        printResult(result);
      }
      exitCode = summarize(results);
    } else if (id !== undefined) {
      const result = await sendPhotographerInvitationById(id, { force, dryRun });
      printResult(result);
      exitCode = summarize([result]);
    }
  } finally {
    await closeDb();
  }

  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
