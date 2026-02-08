import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BukkuClient } from "../client/bukku-client.js";
import { registerCrudTools } from "./factory.js";

// Sales entities (Phase 2)
import { salesQuoteConfig } from "./configs/sales-quote.js";
import { salesOrderConfig } from "./configs/sales-order.js";
import { deliveryOrderConfig } from "./configs/delivery-order.js";
import { salesInvoiceConfig } from "./configs/sales-invoice.js";
import { salesCreditNoteConfig } from "./configs/sales-credit-note.js";
import { salesPaymentConfig } from "./configs/sales-payment.js";
import { salesRefundConfig } from "./configs/sales-refund.js";

// Purchase entities (Phase 3)
import { purchaseOrderConfig } from "./configs/purchase-order.js";
import { goodsReceivedNoteConfig } from "./configs/goods-received-note.js";
import { purchaseBillConfig } from "./configs/purchase-bill.js";
import { purchaseCreditNoteConfig } from "./configs/purchase-credit-note.js";
import { purchasePaymentConfig } from "./configs/purchase-payment.js";
import { purchaseRefundConfig } from "./configs/purchase-refund.js";

/**
 * Tool Registry
 *
 * Orchestrates registration of all MCP tools.
 * Phase 1 established the infrastructure.
 * Phase 2 added sales entity configs (7 entities, 42 tools).
 * Phase 3 adds purchase entity configs (6 entities, 36 tools).
 * Future phases will add banking, inventory, etc.
 */

/**
 * Register all MCP tools with the server.
 *
 * @param server - MCP server instance
 * @param client - Authenticated Bukku API client
 * @returns Number of tools registered
 */
export function registerAllTools(server: McpServer, client: BukkuClient): number {
  let totalTools = 0;

  // Sales entities (Phase 2)
  // Each entity generates 6 tools: list, get, create, update, delete, update-status
  totalTools += registerCrudTools(server, client, salesQuoteConfig);
  totalTools += registerCrudTools(server, client, salesOrderConfig);
  totalTools += registerCrudTools(server, client, deliveryOrderConfig);
  totalTools += registerCrudTools(server, client, salesInvoiceConfig);
  totalTools += registerCrudTools(server, client, salesCreditNoteConfig);
  totalTools += registerCrudTools(server, client, salesPaymentConfig);
  totalTools += registerCrudTools(server, client, salesRefundConfig);

  // Purchase entities (Phase 3)
  // Each entity generates 6 tools: list, get, create, update, delete, update-status
  totalTools += registerCrudTools(server, client, purchaseOrderConfig);
  totalTools += registerCrudTools(server, client, goodsReceivedNoteConfig);
  totalTools += registerCrudTools(server, client, purchaseBillConfig);
  totalTools += registerCrudTools(server, client, purchaseCreditNoteConfig);
  totalTools += registerCrudTools(server, client, purchasePaymentConfig);
  totalTools += registerCrudTools(server, client, purchaseRefundConfig);

  return totalTools;
}
