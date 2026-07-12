# Email

Reusable SMTP email sending for MMC Photoday — booking confirmations, notifications, and operator diagnostics.

**Module:** `src/email/`  
**Test command:** `npm run test:email`

---

## Overview

The email component wraps [Nodemailer](https://nodemailer.com/) with a small, typed API. Configuration comes from environment variables (same `.env` file as the rest of the app). Scripts load env via `node --env-file=.env`, matching `import:catalog` and other CLI commands.

Use it from:

- Next.js API routes / server actions (Node runtime)
- Background scripts under `scripts/`
- Future notification flows (booking confirmed, reminders, etc.)

Do **not** import this module from client components — SMTP credentials must stay server-side.

---

## Configuration

Copy `.env.example` to `.env` and set:

| Variable | Required | Description |
|----------|----------|-------------|
| `SMTP_HOST` | yes | SMTP server hostname |
| `SMTP_PORT` | yes | SMTP port (e.g. `587` for STARTTLS, `465` for implicit TLS) |
| `SMTP_SECURE` | no | `true` / `1` for TLS on connect; defaults to `true` when port is `465` |
| `SMTP_USER` | pair | SMTP username — set together with `SMTP_PASS`, or omit both for open relay |
| `SMTP_PASS` | pair | SMTP password |
| `EMAIL_FROM` | yes | Default `From` header, e.g. `MMC Photoday <noreply@minimoviecon.sk>` |
| `EMAIL_ORGANIZER_TO` | yes (application flow) | Inbox for new cosplayer application notifications |
| `EMAIL_TESTING_TO` | no | When set, all mail is sent to this address instead; body is prefixed with original `to` |
| `EMAIL_TESTING_ALLOWLIST` | no | Comma-separated addresses that bypass `EMAIL_TESTING_TO` and receive mail normally |

Example (typical submission port):

```env
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="noreply@minimoviecon.sk"
SMTP_PASS="your-app-password"
EMAIL_FROM="MMC Photoday <noreply@minimoviecon.sk>"
# EMAIL_TESTING_TO="lukas.zemcak@gmail.com"
# EMAIL_TESTING_ALLOWLIST="lukas.zemcak@gmail.com,anna@example.sk"
```

When `EMAIL_TESTING_TO` is set (dev/staging), every `sendEmail` call delivers to that address and prepends:

```text
[TESTING] This is a testing email. Original recipient (to): cosplayer@example.com
```

When `EMAIL_TESTING_ALLOWLIST` is also set, recipients in that list (case-insensitive, supports `Name <email@example.com>`) are sent normally with no redirect. If `to` is an array, all addresses must be allowlisted to bypass redirect.

Leave `EMAIL_TESTING_TO` unset in production.

---

## API

### `sendEmail(input, options?)`

```typescript
import { sendEmail } from "@/email";

const result = await sendEmail({
  to: "cosplayer@example.com",
  subject: "Booking confirmed",
  text: "Your session is booked for 9:30.",
  html: "<p>Your session is booked for <strong>9:30</strong>.</p>",
  replyTo: "organizer@minimoviecon.sk", // optional
});

console.log(result.messageId);
```

| Field | Required | Notes |
|-------|----------|-------|
| `to` | yes | Single address or array |
| `subject` | yes | |
| `text` | one of | Plain-text body |
| `html` | one of | HTML body — at least one of `text` or `html` is required |
| `from` | no | Overrides `EMAIL_FROM` |
| `replyTo` | no | Reply-To header |

Returns `{ messageId, accepted, rejected }`.

### `loadSmtpConfig()`

Reads and validates SMTP env vars. Useful for diagnostics or custom transport setup. Throws with a clear message if configuration is incomplete.

### Types

Exported from `@/email`: `SendEmailInput`, `SendEmailResult`, `SmtpConfig`, `EmailAddress`.

---

## Test command

Send a live test email to `lukas.zemcak@gmail.com` (or to `EMAIL_TESTING_TO` when that env var is set):

```bash
npm run test:email
```

Requires a configured `.env` with working SMTP credentials. The script prints the message ID and accepted recipients, and exits non-zero if any address is rejected.

Unit tests mock Nodemailer and run with the rest of the suite:

```bash
npm test
```

---

## Integration patterns

### API route

```typescript
import { NextResponse } from "next/server";
import { sendEmail } from "@/email";

export const runtime = "nodejs";

export async function POST() {
  await sendEmail({
    to: "user@example.com",
    subject: "Hello",
    text: "Message body",
  });
  return NextResponse.json({ ok: true });
}
```

### Script

Follow `scripts/test-email.ts`: import from `../src/email`, handle errors with `process.exit(1)`.

### Injecting config in tests

Pass `{ config: testConfig }` as the second argument to avoid reading `process.env` and to use a mocked transporter:

```typescript
await sendEmail(input, { config: testConfig, transporter: mockTransport });
```

---

## Application submit emails

Triggered from `submitApplication` in `src/app/bookings/actions.ts` after a pending booking is created.

| Function | Recipient | Notes |
|----------|-----------|-------|
| `sendApplicationConfirmationToCosplayer` | Cosplayer email | Pending status wording |
| `sendApplicationNotificationToOrganizer` | `EMAIL_ORGANIZER_TO` | Throws if unset; submit still succeeds |
| `sendApplicationNotificationToPhotographer` | Photographer email from `persons.email` | Includes review URL when `login_hash` is set |

Review URL format (built from `BASE_URL` or `CATALOG_BASE_URL`):

```text
{BASE_URL}/photographers/{id}?loginHash={hash}
```

Implementation: `src/email/application-emails.ts`. Email failures are logged and do not block the success redirect.

---

## Photographer invitation emails

Welcome/onboarding mail for photographers with their private review link (`loginHash`).

| Trigger | When |
|---------|------|
| Catalog import | Automatically when a **new** photographer is created (`npm run import:catalog`) |
| CLI bulk | `npm run photographers:send-invitations -- --all` — all photographers not yet invited |
| CLI individual | `npm run photographers:send-invitations -- --id=10` — one photographer |

Options:

| Flag | Effect |
|------|--------|
| `--force` | Re-send even if `persons.invitation_sent_at` is already set |
| `--dry-run` | Print recipients without sending |

Tracking: `persons.invitation_sent_at` is set after a successful send. Re-import of an existing photographer does **not** re-send unless you use `--force`.

Implementation: `src/email/photographer-invitation-emails.ts`, orchestration in `src/db/photographer-invitations.ts`, CLI in `scripts/send-photographer-invitations.ts`.

Email failures during import are logged (`[invitation] failed …`) and do not fail the import run.

---

## Files

| File | Role |
|------|------|
| `src/email/types.ts` | Shared types |
| `src/email/config.ts` | Env loading and validation |
| `src/email/send.ts` | `sendEmail` implementation |
| `src/email/index.ts` | Public exports |
| `src/email/application-emails.ts` | Application submit templates |
| `src/email/application-emails.test.ts` | Application email unit tests |
| `src/email/photographer-invitation-emails.ts` | Photographer onboarding invitation |
| `src/email/photographer-invitation-emails.test.ts` | Invitation email unit tests |
| `scripts/send-photographer-invitations.ts` | Bulk/individual invitation CLI |
| `scripts/test-email.ts` | Live SMTP smoke test |

---

## Future use (notifications milestone)

When booking notifications ship, prefer:

1. Call `sendEmail` from a server-only layer after a successful booking write.
2. Keep templates (subject + body) in a dedicated module, e.g. `src/email/templates/booking-confirmed.ts`, that returns `{ subject, text, html }`.
3. Log `messageId` on send for support/debugging; do not log full email bodies in production.

See [app-workflow.md](./app-workflow.md) — notifications are planned but not yet implemented.
