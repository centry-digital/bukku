import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BukkuClient } from "../../client/bukku-client.js";
import { transformHttpError, transformNetworkError } from "../../errors/transform.js";
import { log } from "../../utils/logger.js";

/**
 * Custom Control Panel Archive/Unarchive Tools
 *
 * Locations only. The Bukku API only defines PATCH for /location/{id} to support
 * the is_archived field. Tags and tag groups do NOT have PATCH endpoints, so
 * archive/unarchive operations are not available for those entity types.
 */

/**
 * Register archive and unarchive tools for locations only.
 *
 * @param server - MCP server instance
 * @param client - Authenticated Bukku API client
 * @returns Number of tools registered (always 2)
 */
export function registerControlPanelArchiveTools(
  server: McpServer,
  client: BukkuClient
): number {
  // Archive location
  server.tool(
    "archive-location",
    "Archive a location (hide from active lists). Use this for locations referenced by transactions instead of deleting them.",
    {
      id: z.number().describe("The location ID"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/location/${params.id}`, {
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
          return transformHttpError(error.status, body, "archive-location");
        }
        return transformNetworkError(error, "archive-location");
      }
    }
  );
  log("Registered tool: archive-location");

  // Unarchive location
  server.tool(
    "unarchive-location",
    "Unarchive a location (restore to active lists).",
    {
      id: z.number().describe("The location ID"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/location/${params.id}`, {
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
          return transformHttpError(error.status, body, "unarchive-location");
        }
        return transformNetworkError(error, "unarchive-location");
      }
    }
  );
  log("Registered tool: unarchive-location");

  return 2;
}
