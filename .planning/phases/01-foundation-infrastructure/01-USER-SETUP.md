# Phase 01: User Setup Guide

This guide covers the manual configuration required for the Bukku MCP server.

## Environment Variables

The following environment variables must be configured before running the server:

| Variable | Required | Source | Example |
|----------|----------|--------|---------|
| `BUKKU_API_TOKEN` | Yes | Bukku Control Panel -> Integrations -> API Access | `bk_live_abc123...` |
| `BUKKU_COMPANY_SUBDOMAIN` | Yes | Your Bukku URL subdomain | `mycompany` (from mycompany.bukku.my) |

## Setup Steps

### 1. Get Bukku API Token

1. Log in to your Bukku account at https://bukku.my
2. Navigate to **Control Panel** → **Integrations**
3. Find the **API Access** section
4. Toggle **Turn on API Access** if not already enabled
5. Click **Copy Access Token** to copy your token
6. Store the token securely - you'll need it for the next step

### 2. Find Your Company Subdomain

Your company subdomain is the part before `.bukku.my` in your Bukku URL.

**Examples:**
- URL: `acme.bukku.my` → Subdomain: `acme`
- URL: `mycompany.bukku.my` → Subdomain: `mycompany`
- URL: `accounting-firm.bukku.my` → Subdomain: `accounting-firm`

### 3. Configure Environment Variables

Add these variables to your environment:

**For Claude Desktop (macOS/Linux):**

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bukku": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/bukku-mcp/build/index.js"],
      "env": {
        "BUKKU_API_TOKEN": "your-token-here",
        "BUKKU_COMPANY_SUBDOMAIN": "your-subdomain-here"
      }
    }
  }
}
```

**For Claude Desktop (Windows):**

Edit `%APPDATA%\Claude\claude_desktop_config.json` with the same structure.

**For command-line testing:**

```bash
export BUKKU_API_TOKEN="your-token-here"
export BUKKU_COMPANY_SUBDOMAIN="your-subdomain-here"
npm run start
```

### 4. Restart Claude Desktop

After configuring environment variables, completely quit and restart Claude Desktop for changes to take effect.

## Verification

The server validates credentials on startup. You'll see one of these outcomes:

### ✅ Success
```
[bukku-mcp] Token validated successfully
```

### ❌ Missing Variables
```
[bukku-mcp] Configuration Error

Missing required environment variables:
  - BUKKU_API_TOKEN: BUKKU_API_TOKEN is required
  - BUKKU_COMPANY_SUBDOMAIN: BUKKU_COMPANY_SUBDOMAIN is required

Setup checklist:
  1. Go to Bukku web app -> Control Panel -> Integrations
  2. Turn on API Access and copy the Access Token
  3. Set BUKKU_API_TOKEN=<your-token>
  4. Set BUKKU_COMPANY_SUBDOMAIN=<your-subdomain>
     (e.g., 'mycompany' from mycompany.bukku.my)
  5. Restart Claude Desktop
```

**Fix:** Follow the setup checklist above.

### ❌ Invalid Token
```
[bukku-mcp] Authentication Error

The provided BUKKU_API_TOKEN is invalid or expired.

Please check:
  1. Token is copied correctly (no extra spaces)
  2. API Access is enabled in Bukku Control Panel -> Integrations
  3. Token has not been revoked or regenerated
```

**Fix:**
- Verify token is copied exactly from Bukku (no extra spaces)
- Regenerate token if needed and update environment variable
- Ensure API Access is still enabled in Bukku settings

## Security Notes

1. **Never commit tokens to git** - The `.gitignore` excludes `.env` files, but always double-check
2. **Token scope** - Bukku API tokens have full account access. Keep them secure.
3. **Rotation** - If a token is compromised, regenerate it immediately in Bukku Control Panel
4. **Logging** - The server never logs actual token values (uses "Bearer ***" in debug output)

## Troubleshooting

### "Configuration Error" after adding variables
- Ensure you completely quit and restarted Claude Desktop (not just closed window)
- Check JSON syntax in `claude_desktop_config.json` (no trailing commas, proper quotes)
- Verify file path to `build/index.js` is absolute and correct

### "Authentication Error" with valid token
- Check your internet connection to api.bukku.my
- Verify API Access is still enabled in Bukku settings
- Try regenerating the token in Bukku Control Panel

### Token works but tools fail
- This indicates the token validates but specific API calls fail
- Check Claude's logs for specific error messages
- Verify your Bukku account has permission for the operation (e.g., creating invoices)

---

**Next Step:** Once environment variables are configured and the server starts successfully, you're ready to use Bukku tools in Claude conversations.
