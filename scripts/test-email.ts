import {
  loadEmailTestingAllowlist,
  loadEmailTestingTo,
  normalizeRecipientEmail,
  sendEmail,
} from "../src/email";

const TEST_RECIPIENT = "lukas.zemcak@gmail.com";

async function main() {
  const testingTo = loadEmailTestingTo();
  const allowlist = loadEmailTestingAllowlist();
  const bypassesRedirect = allowlist.has(normalizeRecipientEmail(TEST_RECIPIENT));
  const result = await sendEmail({
    to: TEST_RECIPIENT,
    subject: "MMC Photoday email test",
    text: [
      "This is a test message from the MMC Photoday email component.",
      "",
      `Sent at: ${new Date().toISOString()}`,
    ].join("\n"),
    html: [
      "<p>This is a <strong>test message</strong> from the MMC Photoday email component.</p>",
      `<p>Sent at: <code>${new Date().toISOString()}</code></p>`,
    ].join(""),
  });

  if (testingTo && bypassesRedirect) {
    console.log(
      `EMAIL_TESTING_TO is set, but ${TEST_RECIPIENT} is in EMAIL_TESTING_ALLOWLIST — sent normally`,
    );
  } else if (testingTo) {
    console.log(
      `EMAIL_TESTING_TO is set — redirected from ${TEST_RECIPIENT} to ${testingTo}`,
    );
  }
  console.log(
    `Email sent to ${testingTo && !bypassesRedirect ? testingTo : TEST_RECIPIENT}`,
  );
  console.log(`Message ID: ${result.messageId}`);
  console.log(`Accepted: ${result.accepted.join(", ") || "(none)"}`);

  if (result.rejected.length > 0) {
    console.error(`Rejected: ${result.rejected.join(", ")}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
