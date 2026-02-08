import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BukkuClient } from "../../client/bukku-client.js";
import { transformHttpError, transformNetworkError } from "../../errors/transform.js";
import { log } from "../../utils/logger.js";

/**
 * Custom Contact Archive/Unarchive Tools
 *
 * Contacts use { is_archived: boolean } via PATCH for archive/unarchive,
 * NOT the standard { status: string } pattern used by the factory status tool.
 * These custom tools handle that difference.
 */

/**
 * Register archive and unarchive tools for contacts.
 *
 * @param server - MCP server instance
 * @param client - Authenticated Bukku API client
 * @returns Number of tools registered (always 2)
 */
export function registerContactArchiveTools(
  server: McpServer,
  client: BukkuClient
): number {
  // Archive contact
  server.tool(
    "archive-contact",
    "Archive a contact (hide from active lists). Use this for contacts with transaction history instead of deleting them.",
    {
      id: z.number().describe("The contact ID"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/contacts/${params.id}`, {
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
          return transformHttpError(error.status, body, "archive-contact");
        }
        return transformNetworkError(error, "archive-contact");
      }
    }
  );
  log("Registered tool: archive-contact");

  // Unarchive contact
  server.tool(
    "unarchive-contact",
    "Unarchive a contact (restore to active lists).",
    {
      id: z.number().describe("The contact ID"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/contacts/${params.id}`, {
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
          return transformHttpError(error.status, body, "unarchive-contact");
        }
        return transformNetworkError(error, "unarchive-contact");
      }
    }
  );
  log("Registered tool: unarchive-contact");

  return 2;
}
