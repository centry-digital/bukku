import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BukkuClient } from "../../client/bukku-client.js";
import { transformHttpError, transformNetworkError } from "../../errors/transform.js";
import { log } from "../../utils/logger.js";

/**
 * Custom Control Panel Archive/Unarchive Tools
 *
 * Locations, tags, and tag groups use { is_archived: boolean } via PATCH
 * for archive/unarchive, NOT the standard { status: string } pattern used
 * by the factory status tool. These custom tools handle that difference.
 */

/**
 * Register archive and unarchive tools for locations, tags, and tag groups.
 *
 * @param server - MCP server instance
 * @param client - Authenticated Bukku API client
 * @returns Number of tools registered (always 6)
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

  // Archive tag
  server.tool(
    "archive-tag",
    "Archive a tag (hide from active lists). Use this for tags referenced by transactions instead of deleting them.",
    {
      id: z.number().describe("The tag ID"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/tags/${params.id}`, {
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
          return transformHttpError(error.status, body, "archive-tag");
        }
        return transformNetworkError(error, "archive-tag");
      }
    }
  );
  log("Registered tool: archive-tag");

  // Unarchive tag
  server.tool(
    "unarchive-tag",
    "Unarchive a tag (restore to active lists).",
    {
      id: z.number().describe("The tag ID"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/tags/${params.id}`, {
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
          return transformHttpError(error.status, body, "unarchive-tag");
        }
        return transformNetworkError(error, "unarchive-tag");
      }
    }
  );
  log("Registered tool: unarchive-tag");

  // Archive tag group
  server.tool(
    "archive-tag-group",
    "Archive a tag group (hide from active lists). Use this for tag groups that contain tags or are referenced by transactions instead of deleting them.",
    {
      id: z.number().describe("The tag group ID"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/tags/groups/${params.id}`, {
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
          return transformHttpError(error.status, body, "archive-tag-group");
        }
        return transformNetworkError(error, "archive-tag-group");
      }
    }
  );
  log("Registered tool: archive-tag-group");

  // Unarchive tag group
  server.tool(
    "unarchive-tag-group",
    "Unarchive a tag group (restore to active lists).",
    {
      id: z.number().describe("The tag group ID"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/tags/groups/${params.id}`, {
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
          return transformHttpError(error.status, body, "unarchive-tag-group");
        }
        return transformNetworkError(error, "unarchive-tag-group");
      }
    }
  );
  log("Registered tool: unarchive-tag-group");

  return 6;
}
