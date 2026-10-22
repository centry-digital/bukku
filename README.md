# Bukku

Tools for the [Bukku](https://bukku.my) accounting platform.

## Packages

| Package                                     | Description                                 | npm                                                                                                                       |
| ------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [@centry-digital/bukku-mcp](./packages/mcp) | MCP server for AI assistants (Claude, etc.) | [![npm](https://img.shields.io/npm/v/@centry-digital/bukku-mcp)](https://www.npmjs.com/package/@centry-digital/bukku-mcp) |
| [@centry-digital/bukku-cli](./packages/cli) | Command-line interface                      | [![npm](https://img.shields.io/npm/v/@centry-digital/bukku-cli)](https://www.npmjs.com/package/@centry-digital/bukku-cli) |

## Quick Start

### For AI assistants (MCP)

Connect your AI client to the Bukku API. See the [MCP package README](./packages/mcp/README.md) for setup instructions.

```bash
npx @centry-digital/bukku-mcp
```

### For command line

Manage invoices, contacts, products, and more from your terminal. See the [CLI package README](./packages/cli/README.md) for full documentation.

```bash
npx @centry-digital/bukku-cli --help
```

Both packages require a Bukku API token and company subdomain. See [Getting Your API Token](./packages/cli/README.md#getting-your-api-token).

## Payment terms on quotes and orders: old vs new format

Bukku's [API changelog](https://developers.bukku.my/changelog) announced that, from 21 October 2026, sales quotes and sales orders take payment terms in a new format, `term_items`, replacing the old top-level `term_id`. A live test on 22 October 2026 found that **Bukku has not switched yet**: it still applies the old format and silently ignores the new one, so a quote sent with only `term_items` is saved with no payment term.

| Format | Example                                                 | Live Bukku API (22 Oct 2026)            | bukku CLI and MCP                           |
| ------ | ------------------------------------------------------- | --------------------------------------- | ------------------------------------------- |
| Old    | `"term_id": 3`                                          | Applied                                 | Accepted, sent in both forms                |
| New    | `"term_items": [{"term_id": 3, "payment_due": "100%"}]` | Accepted, but terms silently dropped    | Accepted, sent in both forms                |
| Split  | `"term_items"` with several items or a custom `date`    | Accepted, but terms silently dropped    | Accepted, with a warning in the result      |
| Both   | `term_id` and `term_items` in one request               | Applies `term_id`, ignores `term_items` | Refused before sending (`VALIDATION_ERROR`) |

Because Bukku may switch without notice, the CLI and MCP server make payment terms stick either way:

1. **Both forms.** A single term for 100%, given in either format, is sent as both a top-level `term_id` and `term_items`. Today Bukku applies `term_id`; after the switch it should apply `term_items`.
2. **Retry.** If Bukku refuses `term_id` (a validation error on that field), the request is sent again with `term_items` only.
3. **Check.** After a create or update, the stored `term_items` are compared with the request. If they differ, for example because split terms were dropped, the result carries a `warnings` field. Sales invoices are unaffected: they already use `term_items`. Contacts now need a `contact_code` on create and update, which the live API enforces.

## Uninstalling

### Step 1: Remove the MCP server configuration

Remove the `"bukku"` entry from the `"mcpServers"` object in your AI client's config file.

**Claude Code:** Remove from `.claude/settings.json` in your project directory (or `~/.claude/settings.json` if added globally).

**Claude Desktop:** Remove from your config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

After editing, restart your AI client for the changes to take effect.

### Step 2: Remove the package (if installed globally)

If you installed the package globally with `npm install -g`, uninstall it:

```bash
npm uninstall -g @centry-digital/bukku-mcp
```

If you were using `npx` (the default Quick Start method), there is no persistent installation to remove — `npx` downloads the package temporarily each time it runs. You can optionally clear the npx cache:

```bash
npx clear-npx-cache
```

### Step 3: Revoke your API token (optional)

If you no longer need API access, log into your Bukku account and revoke the token at **Control Panel > Integrations > API Access**.

## Development

### Prerequisites

- [Node.js](https://nodejs.org) v20 or later

### Setup

```bash
git clone https://github.com/centry-digital/bukku.git
cd bukku
npm ci
npm run verify
```

`npm run verify` runs format, lint, build, typecheck, tests and the MCP/CLI parity check, the same as CI. See [CONTRIBUTING.md](./CONTRIBUTING.md) for how every change is tested and verified, and [docs/github-setup.md](./docs/github-setup.md) for the repository settings.

### Monorepo Structure

```
packages/
  core/   Shared API client, entities, and types (internal)
  mcp/    MCP server package (@centry-digital/bukku-mcp)
  cli/    CLI package (@centry-digital/bukku-cli)
```

Both `mcp` and `cli` depend on `core`, which is bundled at build time and not published separately.

## License

MIT
