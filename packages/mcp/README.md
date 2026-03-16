# Bukku MCP Server

[![npm version](https://img.shields.io/npm/v/@centry-digital/bukku-mcp)](https://www.npmjs.com/package/@centry-digital/bukku-mcp)

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that connects AI assistants to [Bukku](https://bukku.my), a Malaysian accounting platform. This gives your AI the ability to read, create, and manage your accounting data — invoices, bills, payments, contacts, products, and more.

## What can it do?

With this MCP server connected, you can ask your AI things like:

- "List my unpaid sales invoices"
- "Create an invoice for RM 5,000 to Acme Corp for consulting services"
- "Show me all purchase bills from last month"
- "Record a bank transfer of RM 10,000 from Maybank to CIMB"
- "Create a new contact for my supplier"
- "Upload this receipt and attach it to the purchase bill"

The server exposes **169 tools** covering the full Bukku API:

| Category | Tools | What you can do |
|----------|-------|-----------------|
| **Sales** | 42 | Quotes, orders, delivery orders, invoices, credit notes, payments, refunds |
| **Purchases** | 36 | Purchase orders, bills, credit notes, goods received notes, payments, refunds |
| **Banking** | 18 | Money in, money out, bank transfers |
| **Contacts** | 12 | Customers, suppliers, contact groups |
| **Products** | 18 | Products, product bundles, product groups |
| **Accounting** | 13 | Journal entries, chart of accounts |
| **Files** | 3 | Upload and manage file attachments |
| **Organisation** | 17 | Locations, tags, tag groups |
| **Reference Data** | 10 | Tax codes, currencies, payment methods, terms, and more |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) v20 or later
- A [Bukku](https://bukku.my) account with API access enabled
- An AI client that supports MCP (e.g. [Claude Desktop](https://claude.ai/download), [Claude Code](https://docs.anthropic.com/en/docs/claude-code))

### Step 1: Get your Bukku API token

1. Log into your Bukku account
2. Go to **Control Panel > Integrations > API Access**
3. Generate a new API token (or copy your existing one)
4. Note your company subdomain — e.g. `mycompany` from `mycompany.bukku.my`

### Step 2: Add to your AI client

**Claude Desktop** — open your config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bukku": {
      "command": "npx",
      "args": ["-y", "@centry-digital/bukku-mcp"],
      "env": {
        "BUKKU_API_TOKEN": "your-token-here",
        "BUKKU_COMPANY_SUBDOMAIN": "your-subdomain"
      }
    }
  }
}
```

**Claude Code** — add to your project or home `.claude/settings.json`:

```json
{
  "mcpServers": {
    "bukku": {
      "command": "npx",
      "args": ["-y", "@centry-digital/bukku-mcp"],
      "env": {
        "BUKKU_API_TOKEN": "your-token-here",
        "BUKKU_COMPANY_SUBDOMAIN": "your-subdomain"
      }
    }
  }
}
```

### Step 3: Restart your AI client

Quit and reopen your AI client. You're ready to go.

## Installation

### npx (recommended)

No installation needed — downloads and runs the latest version:

```bash
npx @centry-digital/bukku-mcp
```

### npm global install

```bash
npm install -g @centry-digital/bukku-mcp
```

Then use `bukku-mcp` as the command in your AI client config instead of `npx`.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `BUKKU_API_TOKEN` | Yes | Your Bukku API token from Control Panel > Integrations > API Access |
| `BUKKU_COMPANY_SUBDOMAIN` | Yes | Your company subdomain (e.g. `mycompany` from `mycompany.bukku.my`) |

## Troubleshooting

**"Configuration Error" on startup**
- Check that both `BUKKU_API_TOKEN` and `BUKKU_COMPANY_SUBDOMAIN` are set in your client config

**"Token validation failed"**
- Your API token may be invalid or expired — regenerate at Control Panel > Integrations > API Access

**Server doesn't appear in your AI client**
- Verify JSON syntax is correct (no trailing commas)
- Restart your AI client after editing the config
- Check Node.js v20+ is installed: `node --version`

## Uninstalling

If you installed globally:

```bash
npm uninstall -g @centry-digital/bukku-mcp
```

Then remove the `bukku` entry from your AI client's MCP config file.

## Related

- [GitHub repository](https://github.com/centry-digital/bukku)

## License

MIT
