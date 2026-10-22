# bukku verification map

This directory is the maintained source for verifying the user-facing behaviour of the bukku CLI and MCP server. Read this index before driving, then use the matching feature file as the recipe. `V=.claude/skills/verify-bukku` throughout.

## Baseline preconditions

- `$V/scripts/verify.sh launch` printed `ready` and `$V/scripts/verify.sh doctor` prints no `FAIL`.
- Offline unless the recipe says **Live**. Live recipes need `VERIFY_LIVE=1` with `BUKKU_API_TOKEN` and `BUKKU_COMPANY_SUBDOMAIN` for a Bukku **test company**. Without them, report the live steps as unreachable, with that prerequisite.
- Never drive with a client's real company credentials.

## Driving conventions

- One `verify.sh cli` or `verify.sh mcp` call per user action, labelled `<feature-id>/<step>`.
- Offline drives that need credentials pass dummy ones as flags: `--api-token tok_verify_123 --company-subdomain demo`.
- Treat every command as literal. Keep quoted JSON and flags unchanged.
- Results are JSON on stdout; CLI errors are JSON on stderr. Assert exit codes and the JSON `code` field, not message wording.

## Proof and skip reporting

- CLI proof is the `.cmd`, `.stdout`, `.stderr` and `.exit` files of the drive.
- Write proof (live) pairs the write's output with a second, read-only `get` of the same record.
- Record the run id with every artefact you cite.
- Report an unreachable path with the attempted command and the unmet precondition. Do not report it as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behaviour. It then uses exactly four H2 sections in this order: `Sub-features`, `How to get to it (user POV)`, `Driving it with verify.sh` (starting with `Preconditions:`), and `Gotchas`.

## Features

- [CLI credentials and config](./cli-credentials.md) covers missing credentials, `config set`/`show`, precedence and token masking.
- [CLI write dry-runs](./cli-dry-run.md) covers `--dry-run` on create commands for JSON from `--data` and stdin.
- [Journal entry validation](./journal-entry-validation.md) covers the double-entry check on journal entry create and update (CLI and MCP).
- [API write rules](./api-write-rules.md) covers payment terms on sales quotes and orders (top-level `term_id` or `term_items`, never both) and the required `contact_code` on contacts.
- [CLI reads](./cli-reads.md) covers `list`, `get` and `ref-data` against a test company (**Live**).
- [MCP server](./mcp-server.md) covers startup without credentials, and tool listing and read calls (**Live**).
- [npm packaging](./packaging.md) covers what each published tarball contains, and installing and starting both packages from it.
