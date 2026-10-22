# npm packaging

What npm users download: each published package (`@centry-digital/bukku-mcp`, `@centry-digital/bukku-cli`) is a tarball with only `LICENSE`, `README.md`, `package.json` and the single bundled `build/index.js`. Installed from those tarballs, both binaries start without the repository around them.

## Sub-features

- **Tarball contents.** Exactly those four files per package: no `build/tools/`, `build/config/`, `.d.ts` files or anything importing the internal `core` package.
- **Installed CLI.** `bukku --version` and an offline dry-run work from the installed package.
- **Installed MCP server.** Without credentials it prints its setup checklist and exits, rather than crashing.

## How to get to it (user POV)

- `npm install @centry-digital/bukku-cli` or `npx @centry-digital/bukku-mcp`, as in each package's README. Before a release, the tarballs `npm pack` builds stand in for the published ones.

## Driving it with verify.sh

Preconditions: baseline from the index, plus access to the npm registry (the install fetches the packages' dependencies).

- **Pack and install.** Run `$V/scripts/verify.sh install`. Each line of its output (also `install/contents.txt` in the evidence) reads `<name>@<version>: LICENSE README.md build/index.js package.json`, and it ends with `installed`.
- **Doctor on the installed packages.** Run `VERIFY_INSTALLED=1 $V/scripts/verify.sh doctor`. No `FAIL`; the `CLI --version` line matches `packages/cli/package.json`.
- **Installed CLI.** Run `VERIFY_INSTALLED=1 $V/scripts/verify.sh cli packaging/cli-version -- --version` (exit `0`, the version), then `VERIFY_INSTALLED=1 $V/scripts/verify.sh cli packaging/cli-dry-run -- --api-token tok_verify_123 --company-subdomain demo sales invoices create --dry-run --data '{"contact_id":1}'` (exit `0`, JSON with `"dry_run": true`).
- **Installed MCP server.** Run `VERIFY_INSTALLED=1 $V/scripts/verify.sh mcp packaging/mcp-no-credentials -- list`. Exit `2` from the client; stderr contains `Setup checklist` and no `SyntaxError` or `Cannot find module`.

## Gotchas

- `VERIFY_INSTALLED=1` changes which binaries every `cli`, `mcp` and `doctor` call drives; leave it unset for the other recipes, which drive the repo build.
- `install` runs npm with your normal environment so it can reach the registry; it only writes inside the run's sandbox.
- The `build` CI check also packs, installs and starts both tarballs, so a green `build` already proves this; the recipe adds evidence you can cite.
