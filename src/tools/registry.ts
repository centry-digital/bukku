import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BukkuClient } from "../client/bukku-client.js";

/**
 * Tool Registry
 *
 * Orchestrates registration of all MCP tools.
 * In Phase 1, this is intentionally empty - no business tools yet.
 * Phase 2+ will add entity configs for sales, purchases, banking, etc.
 */

/**
 * Register all MCP tools with the server.
 *
 * @param server - MCP server instance
 * @param client - Authenticated Bukku API client
 * @returns Number of tools registered
 */
export function registerAllTools(server: McpServer, client: BukkuClient): number {
  // Entity configs will be added in Phase 2+ (sales, purchases, etc.)
  // Phase 1 establishes the infrastructure - Phase 2 just adds configs

  return 0;
}
