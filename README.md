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

The server exposes **173 tools** covering the full Bukku API:

| Category | Tools | What you can do |
|----------|-------|-----------------|
| **Sales** | 42 | Quotes, orders, delivery orders, invoices, credit notes, payments, refunds |
| **Purchases** | 36 | Purchase orders, bills, credit notes, goods received notes, payments, refunds |
| **Banking** | 18 | Money in, money out, bank transfers |
| **Contacts** | 12 | Customers, suppliers, contact groups |
| **Products** | 18 | Products, product bundles, product groups |
| **Accounting** | 13 | Journal entries, chart of accounts |
| **Files** | 3 | Upload and manage file attachments |
| **Organisation** | 21 | Locations, tags, tag groups |
| **Reference Data** | 10 | Tax codes, currencies, payment methods, terms, and more |

## Quick Start

Get up and running in under 2 minutes.

### Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- A [Bukku](https://bukku.my) account with API access enabled
- An AI client that supports MCP (e.g. [Claude Desktop](https://claude.ai/download), [Claude Code](https://docs.anthropic.com/en/docs/claude-code))

### Step 1: Get your Bukku API token

1. Log into your Bukku account
2. Go to **Control Panel > Integrations > API Access**
3. Generate a new API token (or copy your existing one)
4. Note your company subdomain — e.g. `mycompany` from `mycompany.bukku.my`

### Step 2: Add to your AI client

The configuration includes your organisation's API token and subdomain, so make sure you're connecting to the right Bukku organisation.

**Claude Code (recommended):** Add to your **project-level** `.claude/settings.json` to keep credentials scoped to the relevant project:

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

**Claude Desktop:** Open your config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the same configuration as above.

> **Note:** Claude Desktop uses a single global config, so the MCP server will be available across all conversations. Double-check that your API token and subdomain match the Bukku organisation you intend to work with.

### Step 3: Restart your AI client

Quit and reopen your AI client. That's it — you're ready to go!

## Installation

### npx (recommended)

The quickest way to use the server is with `npx`. No installation needed — it downloads and runs the latest version automatically:

```bash
npx @centry-digital/bukku-mcp
```

This is what the Quick Start configuration uses. `npx` ensures you're always running the latest version without manual updates.

### npm global install

If you prefer a persistent installation:

```bash
npm install -g @centry-digital/bukku-mcp
```

Then update your AI client configuration to use the installed command instead:

```json
{
  "mcpServers": {
    "bukku": {
      "command": "bukku-mcp",
      "env": {
        "BUKKU_API_TOKEN": "your-token-here",
        "BUKKU_COMPANY_SUBDOMAIN": "your-subdomain"
      }
    }
  }
}
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BUKKU_API_TOKEN` | Yes | Your Bukku API token from Control Panel > Integrations > API Access |
| `BUKKU_COMPANY_SUBDOMAIN` | Yes | Your company subdomain (e.g. `mycompany` from `mycompany.bukku.my`) |

### Claude Desktop

Open your configuration file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

**Using npx (recommended):**

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

**If you installed globally:**

```json
{
  "mcpServers": {
    "bukku": {
      "command": "bukku-mcp",
      "env": {
        "BUKKU_API_TOKEN": "your-token-here",
        "BUKKU_COMPANY_SUBDOMAIN": "your-subdomain"
      }
    }
  }
}
```

After updating the config, restart Claude Desktop.

### Claude Code

We recommend adding this to your **project-level** `.claude/settings.json` rather than your home directory, since the configuration includes organisation-specific credentials (API token and subdomain). This keeps credentials scoped to the relevant project and avoids accidentally connecting to the wrong Bukku organisation.

**Using npx (recommended):**

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

**If you installed globally:**

```json
{
  "mcpServers": {
    "bukku": {
      "command": "bukku-mcp",
      "env": {
        "BUKKU_API_TOKEN": "your-token-here",
        "BUKKU_COMPANY_SUBDOMAIN": "your-subdomain"
      }
    }
  }
}
```

### Other MCP Clients

Any client that supports the [MCP stdio transport](https://modelcontextprotocol.io/docs/concepts/transports) can use this server. Use the `npx @centry-digital/bukku-mcp` command with the two environment variables shown above.

## Troubleshooting

**"Configuration Error" on startup**
- Check that both `BUKKU_API_TOKEN` and `BUKKU_COMPANY_SUBDOMAIN` are set in your client config
- Verify the environment variables are inside the `"env"` object

**"Token validation failed"**
- Your API token may be invalid or expired
- Log into Bukku and regenerate your token at Control Panel > Integrations > API Access

**Server doesn't appear in your AI client**
- Verify your configuration JSON syntax is correct (no trailing commas)
- Make sure you've restarted your AI client after editing the config
- Check that Node.js v18 or later is installed: `node --version`

**"Could not resolve package" with npx**
- Check that you have Node.js v18 or later installed
- Verify your network connection and proxy settings if applicable
- Try running `npm view @centry-digital/bukku-mcp` to confirm the package is accessible

**Permission errors with global install**
- Consider using `npx` instead (no installation needed)
- Or fix npm permissions: [https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)

## Development

Want to contribute or run from source? Here's how to set up your development environment.

### Clone and build

```bash
git clone https://github.com/centry-digital/bukku-mcp.git
cd bukku-mcp
npm install
npm run build
```

### Commands

```bash
npm run build    # Compile TypeScript
npm test         # Run tests
npm start        # Start server (requires env vars)
```

### Project structure

```
src/
├── client/       # Bukku API HTTP client
├── config/       # Environment validation
├── errors/       # Error handling and transformation
├── tools/        # MCP tool definitions (one folder per category)
│   ├── sales/
│   ├── purchases/
│   ├── banking/
│   ├── contacts/
│   ├── products/
│   ├── accounting/
│   ├── files/
│   └── ...
└── index.ts      # Server entry point
```

## License

MIT
