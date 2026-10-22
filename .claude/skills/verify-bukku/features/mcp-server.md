# MCP server

An AI client starts `bukku-mcp` over stdio with the user's token and subdomain, sees the Bukku tools, and calls them. Without configuration the server exits with a setup checklist instead of crashing.

## Sub-features

- `mcp-no-config` exits 1 and prints the setup checklist naming both env vars.
- `mcp-list` (**Live**) lists every tool after validating the token.
- `mcp-read` (**Live**) calls a read-only tool and returns its JSON.

## How to get to it (user POV)

- Configure the AI client to run `npx @centry-digital/bukku-mcp` with `BUKKU_API_TOKEN` and `BUKKU_COMPANY_SUBDOMAIN` (see `packages/mcp/README.md`), then ask it to list invoices.

## Driving it with verify.sh

Preconditions:

- Doctor clean (including `MCP bundle has a single hashbang`).

- **No configuration.** Run `$V/scripts/verify.sh mcp mcp/no-config -- list`. Exit `2` from the client (connection closed); stderr contains `Configuration Error`, `BUKKU_API_TOKEN`, `BUKKU_COMPANY_SUBDOMAIN` and `Setup checklist`, and no `SyntaxError`.
- **List tools (Live).** With live credentials, run `$V/scripts/verify.sh mcp mcp/list -- list`. Exit `0`; `count` matches the number in the server's `Bukku MCP server started (N tools registered)` line on stderr, and `names` includes `list-sales-invoices`.
- **Read a tool (Live).** Run `$V/scripts/verify.sh mcp mcp/list-invoices -- call list-sales-invoices '{"page_size":5}'`. Exit `0`; the result's first `content` item is JSON text.

## Gotchas

- The server validates the token against the live API before registering tools, so `list` can't be proven offline. The `unit` CI check covers the tool registry offline instead (`packages/mcp/src/tools/registry.test.ts`).
- Not yet proven live (no test-company credentials when this map was written).
- The harness refuses live MCP tools other than `list-*`, `get-*` and `search-*` unless `VERIFY_ALLOW_WRITES=1`.
