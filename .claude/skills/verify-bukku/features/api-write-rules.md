# API write rules

Creating or updating a sales quote, sales order or contact from the CLI or MCP server checks the body against Bukku API rules, before any request is sent: quotes and orders take payment terms as either a top-level `term_id` or well-formed `term_items`, never both, and contacts require `contact_code`. Refused bodies fail with `VALIDATION_ERROR` (CLI exit 4; MCP tool error), and the create/update help and tool descriptions state the rule.

## Sub-features

- `terms-term-id-ok` sends a quote or order body with a top-level `term_id` with matching `term_items` added.
- `terms-single-item` sends a single 100% `term_items` entry with a matching top-level `term_id` added.
- `terms-retry` retries without `term_id` when Bukku refuses it (unit tests only, until Bukku refuses it live).
- `terms-warning` adds a `warnings` field to the result when the stored `term_items` differ from the request (**Live**).
- `terms-both-refused` refuses a body with both a top-level `term_id` and `term_items`.
- `terms-bad-item` refuses a `term_items` entry without `payment_due`, or with neither `term_id` nor `date`.
- `terms-ok` lets `term_items` (by `term_id` or custom `date`) through to the request.
- `contact-code-missing` refuses a contact create or update without a non-empty `contact_code`.
- `contact-code-ok` lets a contact body with `contact_code` through.
- `write-rules-help` shows the rule in `--help` for the affected create/update commands.

## How to get to it (user POV)

- CLI: `bukku sales quotes create|update`, `bukku sales orders create|update`, `bukku contacts contacts create|update`, with `--data '<json>'` or stdin.
- MCP: `create-sales-quote`, `update-sales-quote`, `create-sales-order`, `update-sales-order`, `create-contact`, `update-contact`.

## Driving it with verify.sh

Preconditions:

- Doctor clean. Offline, with dummy credentials passed as flags. The MCP server cannot list or call tools without live credentials, so the MCP path is covered by `packages/mcp/src/tools/factory.test.ts` offline, and by a live drive only when credentials and write approval are given.

- **Top-level term_id.** Run `$V/scripts/verify.sh cli write-rules/quote-term-id -- --api-token tok_verify_123 --company-subdomain demo sales quotes create --dry-run --data '{"contact_id":1,"date":"2026-10-22","term_id":3}'`. Exit `0`; stdout is a dry-run `POST` whose body also has `"term_items":[{"term_id":3,"payment_due":"100%"}]`.
- **Both forms.** Run `$V/scripts/verify.sh cli write-rules/quote-both -- --api-token tok_verify_123 --company-subdomain demo sales quotes create --dry-run --data '{"contact_id":1,"term_id":3,"term_items":[{"term_id":3,"payment_due":"100%"}]}'`. Exit `4`; stderr has `"code":"VALIDATION_ERROR"`.
- **Bad term item.** Run `$V/scripts/verify.sh cli write-rules/order-bad-item -- --api-token tok_verify_123 --company-subdomain demo sales orders update 12 --dry-run --data '{"term_items":[{"payment_due":"100%"}]}'`. Exit `4`; stderr names `term_items[0]`.
- **Good term items.** Run `$V/scripts/verify.sh cli write-rules/quote-term-items -- --api-token tok_verify_123 --company-subdomain demo sales quotes create --dry-run --data '{"contact_id":1,"date":"2026-10-22","term_items":[{"term_id":3,"payment_due":"50%"},{"date":"2026-12-31","payment_due":"50%"}]}'`. Exit `0`; stdout is a dry-run `POST` to `https://api.bukku.my/sales/quotes` with the body unchanged.
- **Missing contact_code.** Run `$V/scripts/verify.sh cli write-rules/contact-no-code -- --api-token tok_verify_123 --company-subdomain demo contacts contacts create --dry-run --data '{"entity_type":"MALAYSIAN_COMPANY","legal_name":"Verify Sdn Bhd","types":["customer"]}'`. Exit `4`; stderr has `"code":"VALIDATION_ERROR"` and mentions `contact_code`.
- **With contact_code.** Run `$V/scripts/verify.sh cli write-rules/contact-update-code -- --api-token tok_verify_123 --company-subdomain demo contacts contacts update 7 --dry-run --data '{"contact_code":"C-V0007","legal_name":"Verify Sdn Bhd"}'`. Exit `0`; stdout is a dry-run `PUT` to `https://api.bukku.my/contacts/7`.
- **Live: terms stick and warn.** With `VERIFY_LIVE=1 VERIFY_ALLOW_WRITES=1`, create a throwaway contact, then a draft quote with `term_items:[{"term_id":7,"payment_due":"100%"}]` (CLI or MCP `create-sales-quote`) and a draft order with split `term_items` (`50%` by `term_id`, `50%` by `date`). The quote's `transaction.term_items[0].term_id` is `7` with no `warnings`; the order result has a `warnings` entry. Delete all three and `get` each to show it is gone.
- **Help.** Run `$V/scripts/verify.sh cli write-rules/quote-help -- sales quotes create --help`. Exit `0`; stdout mentions `term_items`.

## Gotchas

- Validation runs before the dry-run preview, so `--dry-run` is safe for every case.
- Sales invoices already used `term_items` and are not checked here.
- Bukku's changelog says quotes and orders drop `term_id` for `term_items` from 21 October 2026, but a live run on 22 October 2026 found the API still applying `term_id` and silently ignoring `term_items` (the record keeps a single `100%` item with no term). Live, check stored terms in the result or with a `get`, not the write's exit code. When Bukku switches, rerun the live step: the single-term quote should still stick, and split terms should stop warning.
- `contact_code` is required on update as well as create. Existing contacts were given a code by Bukku, so `get` the contact and send its code back if it is not changing.
- Live responses for quotes and orders still carry a top-level `term_id` (and `term_name`, `due_date`), but read terms from `term_items`, which Bukku fills in from `term_id`.
- A quote or order update needs the `number` field, or Bukku answers 422.
