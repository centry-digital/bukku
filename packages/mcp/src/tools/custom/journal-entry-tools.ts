import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BukkuClient } from 'core';
import { transformHttpError, transformNetworkError, createLogger, validateDoubleEntry } from 'core';

const log = createLogger('bukku-mcp');

/**
 * Custom Journal Entry Tools
 *
 * Provides create and update tools for journal entries with double-entry validation.
 * These tools validate that debits equal credits BEFORE submitting to the API,
 * providing immediate, conversational error messages to Claude.
 *
 * The validation only runs when journal_items (line items) are present in the data.
 * Partial updates that don't touch line items pass through without validation.
 */

/**
 * Register custom journal entry tools: create and update with double-entry validation.
 *
 * @param server - MCP server instance
 * @param client - Authenticated Bukku API client
 * @returns Number of tools registered (always 2)
 */
export function registerJournalEntryTools(
  server: McpServer,
  client: BukkuClient
): number {
  // Create journal entry with validation
  server.tool(
    "create-journal-entry",
    "Create a new journal entry. Use list-accounts to find valid account IDs for line items. Journal entries must have balanced debits and credits (total debits = total credits).",
    {
      data: z.record(z.string(), z.unknown()).describe("Journal entry data including journal_items array with debit/credit amounts and account IDs"),
    },
    async (params) => {
      try {
        // Extract journal_items if present
        const journalItems = params.data.journal_items;

        // Validate double-entry balance if line items present
        if (journalItems && Array.isArray(journalItems)) {
          const validation = validateDoubleEntry(journalItems);
          if (!validation.valid) {
            return {
              isError: true,
              content: [
                {
                  type: "text" as const,
                  text: validation.error!,
                },
              ],
            };
          }
        }

        // Validation passed or no journal_items - proceed with API call
        const result = await client.post("/journal_entries", params.data);
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
          return transformHttpError(error.status, body, "create-journal-entry");
        }
        return transformNetworkError(error, "create-journal-entry");
      }
    }
  );
  log("Registered tool: create-journal-entry");

  // Update journal entry with validation
  server.tool(
    "update-journal-entry",
    "Update an existing journal entry. If updating line items, journal entries must have balanced debits and credits (total debits = total credits).",
    {
      id: z.number().describe("The journal entry ID"),
      data: z.record(z.string(), z.unknown()).describe("Updated journal entry data"),
    },
    async (params) => {
      try {
        // Extract journal_items if present in update data
        const journalItems = params.data.journal_items;

        // Validate double-entry balance if line items present in update
        if (journalItems && Array.isArray(journalItems)) {
          const validation = validateDoubleEntry(journalItems);
          if (!validation.valid) {
            return {
              isError: true,
              content: [
                {
                  type: "text" as const,
                  text: validation.error!,
                },
              ],
            };
          }
        }

        // Validation passed or no journal_items - proceed with API call
        const result = await client.put(`/journal_entries/${params.id}`, params.data);
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
          return transformHttpError(error.status, body, "update-journal-entry");
        }
        return transformNetworkError(error, "update-journal-entry");
      }
    }
  );
  log("Registered tool: update-journal-entry");

  return 2;
}
