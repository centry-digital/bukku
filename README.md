# Bukku MCP Server

MCP server that lets Claude read and write accounting data in Bukku.

## Quick Start

1. **Clone and install**
   ```bash
   git clone https://github.com/your-org/bukku-mcp.git
   cd bukku-mcp
   npm install
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Get your Bukku API token**
   - Log into your Bukku account
   - Navigate to Control Panel → Integrations → API Access
   - Generate a new API token or copy your existing token
   - Note your company subdomain (e.g., `mycompany` from `mycompany.bukku.my`)

4. **Configure Claude Desktop**

   Open your Claude Desktop configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

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

   Replace `/absolute/path/to/bukku-mcp` with the actual absolute path to your cloned repository.

5. **Restart Claude Desktop**

   Completely quit and restart Claude Desktop for the configuration to take effect.

6. **Try it**

   Ask Claude: "List my sales invoices from last month"

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| BUKKU_API_TOKEN | Yes | Your Bukku API access token from Control Panel → Integrations → API Access |
| BUKKU_COMPANY_SUBDOMAIN | Yes | Your company subdomain (e.g., 'mycompany' from mycompany.bukku.my) |

## Available Tools

Tools are added as the project develops. See the roadmap for planned coverage of all Bukku API categories.

## Development

- `npm run build` - Compile TypeScript
- `npm test` - Run tests
- `npm start` - Start server (requires env vars)

## Troubleshooting

**"Configuration Error" on startup**
- Check that both `BUKKU_API_TOKEN` and `BUKKU_COMPANY_SUBDOMAIN` are set in your Claude Desktop config
- Verify the environment variables are inside the `"env"` object

**"Token validation failed"**
- Verify your API token is valid and not expired
- Log into Bukku and regenerate your token if needed
- Ensure you're using the token from Control Panel → Integrations → API Access

**Server doesn't appear in Claude Desktop**
- Check that the absolute path in your config points to the correct location
- Ensure you ran `npm run build` to compile the TypeScript
- Look for `build/index.js` in your project directory
- Completely restart Claude Desktop (quit and reopen)

**Cannot find module errors**
- Run `npm install` to ensure all dependencies are installed
- Run `npm run build` to recompile TypeScript
