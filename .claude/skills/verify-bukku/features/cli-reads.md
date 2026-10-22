# CLI reads

**Live.** A user lists and fetches records from their Bukku company: sales and purchase documents, contacts, products, accounts and reference data, as JSON or a table.

## Sub-features

- `read-list` lists a page of records with filters (`--limit`, `--search`, `--date-from`, …).
- `read-all` follows every page with `--all`.
- `read-table` prints `--format table`.
- `read-get` fetches one record by id.
- `read-ref-data` lists reference data such as `ref-data tax-codes`.

## How to get to it (user POV)

- `bukku sales invoices list`, `bukku sales invoices get <id>`, `bukku sales invoices list --format table`, `bukku ref-data tax-codes`.

## Driving it with verify.sh

Preconditions:

- `VERIFY_LIVE=1` with `BUKKU_API_TOKEN` and `BUKKU_COMPANY_SUBDOMAIN` for a test company, and doctor reports `live credentials set`.
- The test company has at least one sales invoice. If it has none, report `read-get` as failed with that reason; don't create one to make it pass.

- **List.** Run `$V/scripts/verify.sh cli reads/invoices-list -- sales invoices list --limit 5`. Exit `0`; stdout is JSON with at most 5 invoices.
- **Get.** Take an `id` from the list and run `$V/scripts/verify.sh cli reads/invoice-get -- sales invoices get <id>`. Exit `0`; the record's `id` matches.
- **Table.** Run `$V/scripts/verify.sh cli reads/invoices-table -- sales invoices list --limit 5 --format table`. Exit `0`; a text table with a header row.
- **Reference data.** Run `$V/scripts/verify.sh cli reads/tax-codes -- ref-data tax-codes`. Exit `0`; a JSON list of tax codes.
- **Bad token.** Run `BUKKU_API_TOKEN=invalid VERIFY_LIVE=1 $V/scripts/verify.sh cli reads/bad-token -- sales invoices list`. Exit `3` with `"code":"API_ERROR"` on stderr (Bukku answers "User is not authenticated"); it is not the auth exit code `2`.

## Gotchas

- First proven live on 22 October 2026 (run `20261022T114957Z-477`): list output is `{"paging":{…},"transactions":[…]}`, and a bad token exits `3`.
- Behind an HTTPS proxy (a cloud sandbox), live drives need `HTTPS_PROXY` and the CA bundle; `verify.sh` passes them through in live mode and sets `NODE_USE_ENV_PROXY=1`, as Node's fetch ignores the proxy otherwise. The host `api.bukku.my` must also be allowed by the sandbox's network policy.
- Use `bukku <group> --help` to find a resource's command name; they don't always match the API path (see `RESOURCE_NAME_MAP` in `packages/cli/src/commands/factory.ts`).
- `--all` on a large company makes many requests; prefer `--limit` for proof.
