# Journal entry validation

Creating or updating a journal entry from the CLI checks double-entry balance locally before any request is sent: unbalanced entries are refused with the totals and the difference.

## Sub-features

- `je-unbalanced` refuses debits that don't equal credits, with `VALIDATION_ERROR` and exit 4.
- `je-balanced` lets a balanced entry through to the request (shown with `--dry-run`).

## How to get to it (user POV)

- Run `bukku accounting journal-entries create --data '<json>'` (or `update <id>`).

## Driving it with verify.sh

Preconditions:

- Doctor clean. Offline, with dummy credentials passed as flags.

- **Unbalanced.** Run `$V/scripts/verify.sh cli journal-entry/unbalanced -- --api-token tok_verify_123 --company-subdomain demo accounting journal-entries create --dry-run --data '{"date":"2026-10-22","journal_items":[{"account_id":1,"debit_amount":100},{"account_id":2,"credit_amount":90}]}'`. Exit `4`; stderr has `"code":"VALIDATION_ERROR"`, with debits `100.00`, credits `90.00` and difference `10.00`.
- **Balanced.** Run the same with `"credit_amount":100` and label `journal-entry/balanced`. Exit `0`; stdout is a dry-run `POST` to `https://api.bukku.my/journal_entries` with the body unchanged.

## Gotchas

- Validation runs before the dry-run preview, so `--dry-run` is safe for both cases.
- Amounts are in ringgit (MYR) as decimal numbers, not sen.
