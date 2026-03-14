import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BukkuClient } from 'core';
import { transformHttpError, transformNetworkError, createLogger } from 'core';

const log = createLogger('bukku-mcp');

/**
 * Custom Location Tools for Get, Update, and Delete Operations
 *
 * The Bukku API has an inconsistency where:
 * - List/create use /locations (plural)
 * - Get/update/delete use /location/{id} (singular)
 *
 * The factory generates tools based on apiBasePath, which would incorrectly produce
 * /locations/{id} for single-item operations. These custom tools handle the singular path.
 */

/**
 * Register custom location tools for get, update, and delete operations.
 *
 * @param server - MCP server instance
 * @param client - Authenticated Bukku API client
 * @returns Number of tools registered (always 3)
 */
export function registerLocationTools(
  server: McpServer,
  client: BukkuClient
): number {
  // Get location
  server.tool(
    "get-location",
    "Get a location for multi-branch accounting by ID",
    {
      id: z.number().describe("The location ID"),
    },
    async (params) => {
      try {
        const result = await client.get(`/location/${params.id}`);
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
          return transformHttpError(error.status, body, "get-location");
        }
        return transformNetworkError(error, "get-location");
      }
    }
  );
  log("Registered tool: get-location");

  // Update location
  server.tool(
    "update-location",
    "Update an existing location for multi-branch accounting",
    {
      id: z.number().describe("The location ID"),
      data: z.record(z.string(), z.unknown()).describe("Updated data"),
    },
    async (params) => {
      try {
        const result = await client.put(`/location/${params.id}`, params.data);
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
          return transformHttpError(error.status, body, "update-location");
        }
        return transformNetworkError(error, "update-location");
      }
    }
  );
  log("Registered tool: update-location");

  // Delete location
  server.tool(
    "delete-location",
    "Delete a location for multi-branch accounting. API may restrict deletion if location is referenced by transactions. Archive instead if deletion fails.",
    {
      id: z.number().describe("The location ID"),
    },
    async (params) => {
      try {
        await client.delete(`/location/${params.id}`);
        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully deleted location with ID ${params.id}`,
            },
          ],
        };
      } catch (error) {
        if (error instanceof Response) {
          const body = await error.json().catch(() => null);
          return transformHttpError(error.status, body, "delete-location");
        }
        return transformNetworkError(error, "delete-location");
      }
    }
  );
  log("Registered tool: delete-location");

  return 3;
}
