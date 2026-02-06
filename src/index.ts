#!/usr/bin/env node

/**
 * Bukku MCP Server Entry Point
 *
 * Startup sequence:
 * 1. Validate environment variables (BUKKU_API_TOKEN, BUKKU_COMPANY_SUBDOMAIN)
 * 2. Create BukkuClient with validated env
 * 3. Validate API token via lightweight API call
 * 4. Create MCP server and register tools
 * 5. Connect via stdio transport
 * 6. Log startup to stderr
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { validateEnv } from "./config/env.js";
import { BukkuClient } from "./client/bukku-client.js";
import { registerAllTools } from "./tools/registry.js";
import { log } from "./utils/logger.js";

/**
 * Main entry point.
 * Exits process if configuration or authentication fails.
 */
async function main(): Promise<void> {
  // Step 1: Validate environment variables
  const env = validateEnv();

  // Step 2: Create authenticated Bukku API client
  const client = new BukkuClient(env);

  // Step 3: Validate API token
  await client.validateToken();

  // Step 4: Create MCP server
  const server = new McpServer({
    name: "bukku",
    version: "1.0.0",
  });

  // Step 5: Register all tools
  const toolCount = registerAllTools(server, client);

  // Step 6: Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Step 7: Log startup to stderr
  log(`Bukku MCP server started (${toolCount} tools registered)`);
}

// Execute main and handle fatal errors
main().catch((error) => {
  log("Fatal error during startup:", error);
  process.exit(1);
});
