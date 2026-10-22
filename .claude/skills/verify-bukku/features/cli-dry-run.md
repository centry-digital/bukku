# CLI write dry-runs

Every CLI command that changes data accepts `--dry-run`, which prints the HTTP request it would send (method, full URL, masked auth header and JSON body) and exits without calling the API.

## Sub-features

- `dry-run-data` previews a create from `--data '<json>'`.
- `dry-run-stdin` previews a create from JSON piped on stdin.
- `dry-run-invalid-json` rejects malformed JSON with `VALIDATION_ERROR` and exit 4.

## How to get to it (user POV)

- Add `--dry-run` to any `create`, `update`, `delete` or `status` command, for example `bukku sales invoices create --data '{…}' --dry-run`.

## Driving it with verify.sh

Preconditions:

- Doctor clean. Offline, with dummy credentials passed as flags.

- **From --data.** Run `$V/scripts/verify.sh cli dry-run/data -- --api-token tok_verify_123 --company-subdomain demo sales invoices create --dry-run --data '{"contact_id":1,"date":"2026-10-22","form_items":[{"description":"Consulting","unit_price":100,"quantity":1}]}'`. Exit `0`; stdout has `"dry_run": true`, `"method": "POST"`, `"url": "https://api.bukku.my/sales/invoices"`, `"Authorization": "Bearer tok****"` and the body unchanged.
- **From stdin.** Run `echo '{"name":"Verify tag"}' | $V/scripts/verify.sh cli dry-run/stdin -- --api-token tok_verify_123 --company-subdomain demo control-panel tags create --dry-run`. Exit `0`; the body is `{"name":"Verify tag"}`.
- **Invalid JSON.** Run `$V/scripts/verify.sh cli dry-run/invalid -- --api-token tok_verify_123 --company-subdomain demo sales invoices create --dry-run --data '{not json'`. Exit `4`; stderr has `"code":"VALIDATION_ERROR"`.
- **No network.** The dummy token would fail against the real API, so exit `0` above proves no request was made.

## Gotchas

- `--data` takes a JSON string, not a file path. To use a file: `--data "$(cat file.json)"` or pipe it.
- `list` and `get` have no `--dry-run` (they don't change data) and fail with `unknown option '--dry-run'`.
- Dry-run still requires credentials to be set; it only masks them.
