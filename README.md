# Bukku MCP Server

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

## Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- A [Bukku](https://bukku.my) account with API access enabled
- An AI client that supports MCP (e.g. [Claude Desktop](https://claude.ai/download), [Claude Code](https://docs.anthropic.com/en/docs/claude-code))

## Setup

### 1. Clone and build

```bash
git clone https://github.com/centry-digital/bukku-mcp.git
cd bukku-mcp
npm install
npm run build
```

### 2. Get your Bukku API token

1. Log into your Bukku account
2. Go to **Control Panel > Integrations > API Access**
3. Generate a new API token (or copy your existing one)
4. Note your company subdomain — e.g. `mycompany` from `mycompany.bukku.my`

### 3. Connect to your AI client

#### Claude Desktop

Open your config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the Bukku MCP server:

```json
{
  "mcpServers": {
    "bukku": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/bukku-mcp/build/index.js"],
      "env": {
        "BUKKU_API_TOKEN": "your-token-here",
        "BUKKU_COMPANY_SUBDOMAIN": "your-subdomain"
      }
    }
  }
}
```

Then restart Claude Desktop.

#### Claude Code

Add to your Claude Code settings (`.claude/settings.json` or project-level):

```json
{
  "mcpServers": {
    "bukku": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/bukku-mcp/build/index.js"],
      "env": {
        "BUKKU_API_TOKEN": "your-token-here",
        "BUKKU_COMPANY_SUBDOMAIN": "your-subdomain"
      }
    }
  }
}
```

#### Other MCP clients

Any client that supports the [MCP stdio transport](https://modelcontextprotocol.io/docs/concepts/transports) can use this server. Set the command to `node /path/to/bukku-mcp/build/index.js` and provide the two environment variables.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `BUKKU_API_TOKEN` | Yes | Your Bukku API token from Control Panel > Integrations > API Access |
| `BUKKU_COMPANY_SUBDOMAIN` | Yes | Your company subdomain (e.g. `mycompany` from `mycompany.bukku.my`) |

## Development

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

## Troubleshooting

**"Configuration Error" on startup**
- Check that both `BUKKU_API_TOKEN` and `BUKKU_COMPANY_SUBDOMAIN` are set in your client config
- Verify the environment variables are inside the `"env"` object

**"Token validation failed"**
- Your API token may be invalid or expired
- Log into Bukku and regenerate your token at Control Panel > Integrations > API Access

**Server doesn't appear in Claude Desktop**
- Confirm the path in your config points to `build/index.js`
- Make sure you ran `npm run build`
- Fully quit and restart Claude Desktop

**Cannot find module errors**
- Run `npm install` then `npm run build`

## License

MIT
