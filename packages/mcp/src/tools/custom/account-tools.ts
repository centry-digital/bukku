import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BukkuClient } from 'core';
import { transformHttpError, transformNetworkError, createLogger } from 'core';

const log = createLogger('bukku-mcp');

/**
 * Custom Account Tools
 *
 * Provides:
 * 1. search-accounts: Filtered search of chart of accounts (category, archived status, etc.)
 * 2. archive-account: Archive account via PATCH { is_archived: true }
 * 3. unarchive-account: Unarchive account via PATCH { is_archived: false }
 *
 * Note: Phase 5's list-accounts provides cached quick lookup.
 * Use search-accounts for filtered queries with pagination.
 */

/**
 * Register custom account tools: search, archive, unarchive.
 *
 * @param server - MCP server instance
 * @param client - Authenticated Bukku API client
 * @returns Number of tools registered (always 3)
 */
export function registerAccountCustomTools(
  server: McpServer,
  client: BukkuClient
): number {
  // Search accounts with filtering
  server.tool(
    "search-accounts",
    "Search and filter accounts from the chart of accounts. Supports filtering by category and archived status. For a quick cached account lookup (e.g., to find account IDs for journal entries), use list-accounts instead.",
    {
      search: z.string().optional().describe("Search by account name, code, or description"),
      category: z.enum(["assets", "liabilities", "equity", "income", "expenses"]).optional().describe("Filter by account category"),
      is_archived: z.boolean().optional().describe("Filter by archived status (default: false, showing only active accounts)"),
      sort_by: z.enum(["code", "name", "balance"]).optional().describe("Sort field (default: code)"),
      sort_dir: z.enum(["asc", "desc"]).optional().describe("Sort direction (default: asc)"),
      page: z.number().optional().describe("Page number for pagination"),
      page_size: z.number().optional().describe("Number of items per page"),
    },
    async (params) => {
      try {
        // Convert boolean is_archived to string for query parameter
        const queryParams: Record<string, string | number | undefined> = {
          search: params.search,
          category: params.category,
          sort_by: params.sort_by,
          sort_dir: params.sort_dir,
          page: params.page,
          page_size: params.page_size,
        };

        // Add is_archived as string if provided
        if (params.is_archived !== undefined) {
          queryParams.is_archived = params.is_archived ? "true" : "false";
        }

        const result = await client.get("/accounts", queryParams);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Response) {
          const body = await error.json().catch(() => null);
          return transformHttpError(error.status, body, "search-accounts");
        }
        return transformNetworkError(error, "search-accounts");
      }
    }
  );
  log("Registered tool: search-accounts");

  // Archive account
  server.tool(
    "archive-account",
    "Archive an account (hide from active lists). Use this instead of delete for accounts with transaction history. Archived accounts are hidden by default but can be reactivated.",
    {
      id: z.number().describe("The account ID"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/accounts/${params.id}`, {
          is_archived: true,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Response) {
          const body = await error.json().catch(() => null);
          return transformHttpError(error.status, body, "archive-account");
        }
        return transformNetworkError(error, "archive-account");
      }
    }
  );
  log("Registered tool: archive-account");

  // Unarchive account
  server.tool(
    "unarchive-account",
    "Unarchive an account (restore to active lists).",
    {
      id: z.number().describe("The account ID"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/accounts/${params.id}`, {
          is_archived: false,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Response) {
          const body = await error.json().catch(() => null);
          return transformHttpError(error.status, body, "unarchive-account");
        }
        return transformNetworkError(error, "unarchive-account");
      }
    }
  );
  log("Registered tool: unarchive-account");

  return 3;
}
