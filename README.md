# Bukku

Tools for the [Bukku](https://bukku.my) accounting platform.

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [@centry-digital/bukku-mcp](./packages/mcp) | MCP server for AI assistants (Claude, etc.) | [![npm](https://img.shields.io/npm/v/@centry-digital/bukku-mcp)](https://www.npmjs.com/package/@centry-digital/bukku-mcp) |
| [@centry-digital/bukku-cli](./packages/cli) | Command-line interface | [![npm](https://img.shields.io/npm/v/@centry-digital/bukku-cli)](https://www.npmjs.com/package/@centry-digital/bukku-cli) |

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
git clone https://github.com/centry-digital/bukku-mcp.git
cd bukku-mcp
npm install
npm run build
npm test
```

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
