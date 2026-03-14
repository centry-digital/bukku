/**
 * Custom Reference Data Tools
 *
 * Reference data (tax codes, currencies, payment methods, etc.) is accessed
 * via Bukku's unified POST /v2/lists endpoint, not standard GET CRUD endpoints.
 * These custom tools fetch reference data with transparent 5-minute caching.
 *
 * IMPORTANT: The Bukku API only provides a READ endpoint for reference data.
 * There are NO separate CRUD endpoints for these entity types.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BukkuClient } from 'core';
import type { ReferenceDataCache } from 'core';
import { transformHttpError, transformNetworkError, createLogger } from 'core';

const log = createLogger('bukku-mcp');

/**
 * Reference data types available from POST /v2/lists endpoint
 */
const REFERENCE_TYPES = [
  {
    type: "tax_codes",
    toolName: "list-tax-codes",
    description: "List all tax codes (tax rate definitions for invoices and purchases). Use to find valid tax_code_id values before creating sales invoices, purchase bills, or products.",
  },
  {
    type: "currencies",
    toolName: "list-currencies",
    description: "List all activated currencies. Use to find valid currency_code values for multi-currency transactions.",
  },
  {
    type: "payment_methods",
    toolName: "list-payment-methods",
    description: "List all payment methods (e.g., Bank Transfer, Cash, Credit Card). Use to find valid payment_method_id values for payments and refunds.",
  },
  {
    type: "terms",
    toolName: "list-terms",
    description: "List all payment terms (e.g., Net 30, Due on Receipt). Use to find valid term_id values when creating invoices or bills.",
  },
  {
    type: "accounts",
    toolName: "list-accounts",
    description: "List all accounts from the chart of accounts. Use to find valid account IDs for sale_account_id, purchase_account_id, and inventory_account_id in products, and for journal entries.",
  },
  {
    type: "price_levels",
    toolName: "list-price-levels",
    description: "List all price levels (custom pricing tiers for volume discounts). Use to find valid price_level_id values for product custom pricing.",
  },
  {
    type: "countries",
    toolName: "list-countries",
    description: "List all countries ordered by name. Use to find valid country codes for contacts and locations.",
  },
  {
    type: "classification_code_list",
    toolName: "list-classification-codes",
    description: "List all product classification codes (Malaysia LHDN e-Invoice). Use to find valid classification_code values for products.",
  },
  {
    type: "numberings",
    toolName: "list-numberings",
    description: "List all document numbering schemes. Use to find valid numbering IDs for transactions.",
  },
  {
    type: "state_list",
    toolName: "list-states",
    description: "List all geographic states/provinces for addresses.",
  },
] as const;

/**
 * Register all reference data list tools
 * @param server MCP server instance
 * @param client Bukku API client
 * @param cache Reference data cache instance
 * @returns Number of tools registered
 */
export function registerReferenceDataTools(
  server: McpServer,
  client: BukkuClient,
  cache: ReferenceDataCache
): number {
  for (const { type, toolName, description } of REFERENCE_TYPES) {
    server.tool(
      toolName,
      description,
      {},
      async () => {
        // Check cache first
        const cached = cache.get<unknown>(type);
        if (cached) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }],
          };
        }

        // Cache miss - fetch from API
        try {
          const result = await client.post("/v2/lists", {
            lists: [type],
            params: [],
          });

          // Store in cache
          cache.set(type, result);

          return {
            content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          if (error instanceof Response) {
            const body = await error.json().catch(() => null);
            return transformHttpError(error.status, body, toolName);
          }
          return transformNetworkError(error, toolName);
        }
      }
    );
    log(`Registered tool: ${toolName}`);
  }

  return REFERENCE_TYPES.length;
}
