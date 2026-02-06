import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BukkuClient } from "../client/bukku-client.js";
import type { CrudEntityConfig } from "../types/bukku.js";
import { transformHttpError, transformNetworkError } from "../errors/transform.js";
import { log } from "../utils/logger.js";

/**
 * CRUD Factory Pattern
 *
 * Generates MCP tools from entity configuration objects.
 * Core architecture that scales to 55+ tools without duplication.
 *
 * Each CrudEntityConfig produces up to 6 tools:
 * - list-{entity}s: Paginated list with filters
 * - get-{entity}: Single item by ID
 * - create-{entity}: Create new item
 * - update-{entity}: Update existing item
 * - delete-{entity}: Delete item
 * - update-{entity}-status: Update item status (if hasStatusUpdate=true)
 */

/**
 * Register all CRUD tools for a single entity.
 *
 * @param server - MCP server instance
 * @param client - Authenticated Bukku API client
 * @param config - Entity configuration
 * @returns Number of tools registered
 */
export function registerCrudTools(
  server: McpServer,
  client: BukkuClient,
  config: CrudEntityConfig
): number {
  let toolCount = 0;

  // List tool: list-{entity}s
  if (config.operations.includes("list")) {
    const listName = `list-${config.entity}s`;
    const listDescription = `List ${config.description}s with optional filters`;

    // Build input schema for list tool
    const listSchema: Record<string, z.ZodTypeAny> = {
      page: z.number().optional().describe("Page number for pagination"),
      page_size: z.number().optional().describe("Number of items per page"),
      search: z.string().optional().describe("Search query"),
      date_from: z.string().optional().describe("Filter by start date (YYYY-MM-DD)"),
      date_to: z.string().optional().describe("Filter by end date (YYYY-MM-DD)"),
      status: z.string().optional().describe("Filter by status"),
      sort_by: z.string().optional().describe("Field to sort by"),
      sort_dir: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
    };

    // Add any additional list filters from config
    if (config.listFilters) {
      for (const filter of config.listFilters) {
        listSchema[filter] = z.string().optional().describe(`Filter by ${filter}`);
      }
    }

    server.tool(
      listName,
      listDescription,
      listSchema,
      async (params) => {
        try {
          const result = await client.get(config.apiBasePath, params as Record<string, string | number | undefined>);
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          // Handle HTTP errors
          if (error instanceof Response) {
            const body = await error.json().catch(() => null);
            return transformHttpError(error.status, body, listName);
          }
          // Handle network errors
          return transformNetworkError(error, listName);
        }
      }
    );
    toolCount++;
    log(`Registered tool: ${listName}`);
  }

  // Get tool: get-{entity}
  if (config.operations.includes("get")) {
    const getName = `get-${config.entity}`;
    const getDescription = `Get a ${config.description} by ID`;

    server.tool(
      getName,
      getDescription,
      {
        id: z.number().describe(`The ${config.description} ID`),
      },
      async (params) => {
        try {
          const result = await client.get(`${config.apiBasePath}/${params.id}`);
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
            return transformHttpError(error.status, body, getName);
          }
          return transformNetworkError(error, getName);
        }
      }
    );
    toolCount++;
    log(`Registered tool: ${getName}`);
  }

  // Create tool: create-{entity}
  if (config.operations.includes("create")) {
    const createName = `create-${config.entity}`;
    const createDescription = `Create a new ${config.description}`;

    server.tool(
      createName,
      createDescription,
      {
        data: z.record(z.string(), z.unknown()).describe("Data for the new item"),
      },
      async (params) => {
        try {
          const result = await client.post(config.apiBasePath, params.data);
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
            return transformHttpError(error.status, body, createName);
          }
          return transformNetworkError(error, createName);
        }
      }
    );
    toolCount++;
    log(`Registered tool: ${createName}`);
  }

  // Update tool: update-{entity}
  if (config.operations.includes("update")) {
    const updateName = `update-${config.entity}`;
    const updateDescription = `Update an existing ${config.description}`;

    server.tool(
      updateName,
      updateDescription,
      {
        id: z.number().describe(`The ${config.description} ID`),
        data: z.record(z.string(), z.unknown()).describe("Updated data"),
      },
      async (params) => {
        try {
          const result = await client.put(`${config.apiBasePath}/${params.id}`, params.data);
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
            return transformHttpError(error.status, body, updateName);
          }
          return transformNetworkError(error, updateName);
        }
      }
    );
    toolCount++;
    log(`Registered tool: ${updateName}`);
  }

  // Delete tool: delete-{entity}
  if (config.operations.includes("delete")) {
    const deleteName = `delete-${config.entity}`;
    const deleteDescription = `Delete a ${config.description}`;

    server.tool(
      deleteName,
      deleteDescription,
      {
        id: z.number().describe(`The ${config.description} ID`),
      },
      async (params) => {
        try {
          await client.delete(`${config.apiBasePath}/${params.id}`);
          return {
            content: [
              {
                type: "text" as const,
                text: `Successfully deleted ${config.description} with ID ${params.id}`,
              },
            ],
          };
        } catch (error) {
          if (error instanceof Response) {
            const body = await error.json().catch(() => null);
            return transformHttpError(error.status, body, deleteName);
          }
          return transformNetworkError(error, deleteName);
        }
      }
    );
    toolCount++;
    log(`Registered tool: ${deleteName}`);
  }

  // Status update tool: update-{entity}-status
  if (config.hasStatusUpdate) {
    const statusName = `update-${config.entity}-status`;
    const statusDescription = `Update the status of a ${config.description}`;

    server.tool(
      statusName,
      statusDescription,
      {
        id: z.number().describe(`The ${config.description} ID`),
        status: z.string().describe("New status value"),
      },
      async (params) => {
        try {
          const result = await client.patch(`${config.apiBasePath}/${params.id}`, {
            status: params.status,
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
            return transformHttpError(error.status, body, statusName);
          }
          return transformNetworkError(error, statusName);
        }
      }
    );
    toolCount++;
    log(`Registered tool: ${statusName}`);
  }

  return toolCount;
}
