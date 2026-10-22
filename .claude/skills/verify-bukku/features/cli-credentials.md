# CLI credentials and config

A user gives the CLI their Bukku API token and company subdomain by flag, environment variable or `~/.bukkurc`, can inspect what the CLI will use, and gets a clear authentication error when nothing is set.

## Sub-features

- `auth-missing` fails with `AUTH_MISSING` and exit 2 when no credentials are set.
- `config-set` writes `api_token` and `company_subdomain` to `~/.bukkurc` with mode 600.
- `config-show` prints the resolved values and their source, with the token masked.
- `precedence` lets a flag override the env var, and the env var override the rc file.

## How to get to it (user POV)

- Run any API command (for example `bukku sales invoices list`) with no credentials.
- Run `bukku config set <key> <value>` and `bukku config show`.
- Pass `--api-token` and `--company-subdomain` before the command.

## Driving it with verify.sh

Preconditions:

- A fresh run (the sandbox `HOME` has no `.bukkurc`). Offline.

- **Missing credentials.** Run `$V/scripts/verify.sh cli creds/missing -- sales invoices list`. Exit `2`; stderr JSON has `"code":"AUTH_MISSING"`.
- **Set config.** Run `$V/scripts/verify.sh cli creds/set-token -- config set api_token tok_verify_123` and `$V/scripts/verify.sh cli creds/set-subdomain -- config set company_subdomain demo`. Each exits `0` with `"ok":true`. Then `ls -l .verify/run/$(cat .verify/run/current)/home/.bukkurc` shows `-rw-------`.
- **Show config.** Run `$V/scripts/verify.sh cli creds/show -- config show`. Exit `0`; `api_token.value` is `********` (no characters of the token are shown) and `source` is `rc` for both keys.
- **Flag wins.** Run `$V/scripts/verify.sh cli creds/flag -- --api-token tok_flag_456 config show`. `api_token.source` is `flags`.

## Gotchas

- Global flags go **before** the subcommand (`bukku --api-token … config show`).
- `config set` only accepts `api_token` and `company_subdomain`.
- Never run these against the real `HOME`: the harness's sandbox exists so the user's own `~/.bukkurc` is never read or overwritten.
