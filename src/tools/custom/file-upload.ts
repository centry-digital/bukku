import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BukkuClient } from "../../client/bukku-client.js";
import { transformHttpError, transformNetworkError } from "../../errors/transform.js";
import { log } from "../../utils/logger.js";

/**
 * Custom File Upload Tool
 *
 * Handles file uploads to Bukku via multipart/form-data.
 * This is the only multipart/form-data operation in the entire API.
 * Returns file object with id, url, and metadata.
 */

/**
 * Register upload-file tool.
 *
 * @param server - MCP server instance
 * @param client - Authenticated Bukku API client
 * @returns Number of tools registered (always 1)
 */
export function registerFileUploadTool(
  server: McpServer,
  client: BukkuClient
): number {
  server.tool(
    "upload-file",
    "Upload a file to Bukku. Returns file object with id, url, and metadata. Use the returned file id in transaction file_ids arrays to attach files to sales invoices, purchase bills, and other documents.",
    {
      file_path: z.string().describe("Absolute path to the file on disk"),
    },
    async (params) => {
      try {
        const result = await client.postMultipart("/files", params.file_path);
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
          return transformHttpError(error.status, body, "upload-file");
        }
        return transformNetworkError(error, "upload-file");
      }
    }
  );
  log("Registered tool: upload-file");

  return 1;
}
