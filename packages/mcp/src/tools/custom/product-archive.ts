import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BukkuClient } from 'core';
import { transformHttpError, transformNetworkError, createLogger } from 'core';

const log = createLogger('bukku-mcp');

/**
 * Custom Product Archive/Unarchive Tools
 *
 * Products and bundles use { is_archived: boolean } via PATCH for archive/unarchive,
 * NOT the standard { status: string } pattern used by the factory status tool.
 * These custom tools handle that difference.
 */

/**
 * Register archive and unarchive tools for products and bundles.
 *
 * @param server - MCP server instance
 * @param client - Authenticated Bukku API client
 * @returns Number of tools registered (always 4)
 */
export function registerProductArchiveTools(
  server: McpServer,
  client: BukkuClient
): number {
  // Archive product
  server.tool(
    "archive-product",
    "Archive a product (hide from active lists). Use this for products with transaction history instead of deleting them.",
    {
      id: z.number().describe("The product ID"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/products/${params.id}`, {
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
          return transformHttpError(error.status, body, "archive-product");
        }
        return transformNetworkError(error, "archive-product");
      }
    }
  );
  log("Registered tool: archive-product");

  // Unarchive product
  server.tool(
    "unarchive-product",
    "Unarchive a product (restore to active lists).",
    {
      id: z.number().describe("The product ID"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/products/${params.id}`, {
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
          return transformHttpError(error.status, body, "unarchive-product");
        }
        return transformNetworkError(error, "unarchive-product");
      }
    }
  );
  log("Registered tool: unarchive-product");

  // Archive product bundle
  server.tool(
    "archive-product-bundle",
    "Archive a product bundle (hide from active lists). Use this for bundles with transaction history instead of deleting them.",
    {
      id: z.number().describe("The product bundle ID"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/products/bundles/${params.id}`, {
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
          return transformHttpError(error.status, body, "archive-product-bundle");
        }
        return transformNetworkError(error, "archive-product-bundle");
      }
    }
  );
  log("Registered tool: archive-product-bundle");

  // Unarchive product bundle
  server.tool(
    "unarchive-product-bundle",
    "Unarchive a product bundle (restore to active lists).",
    {
      id: z.number().describe("The product bundle ID"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/products/bundles/${params.id}`, {
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
          return transformHttpError(error.status, body, "unarchive-product-bundle");
        }
        return transformNetworkError(error, "unarchive-product-bundle");
      }
    }
  );
  log("Registered tool: unarchive-product-bundle");

  return 4;
}
