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

// Banking entities (Phase 4)
import { bankMoneyInConfig } from "./configs/bank-money-in.js";
import { bankMoneyOutConfig } from "./configs/bank-money-out.js";
import { bankTransferConfig } from "./configs/bank-transfer.js";

// Contact entities (Phase 4)
import { contactConfig } from "./configs/contact.js";
import { contactGroupConfig } from "./configs/contact-group.js";

// Product entities (Phase 5)
import { productConfig } from "./configs/product.js";
import { productBundleConfig } from "./configs/product-bundle.js";
import { productGroupConfig } from "./configs/product-group.js";

// Custom tools (Phase 4)
import { registerContactArchiveTools } from "./custom/contact-archive.js";

// Custom tools (Phase 5)
import { registerProductArchiveTools } from "./custom/product-archive.js";
import { registerReferenceDataTools } from "./custom/reference-data.js";

// Cache (Phase 5)
import { ReferenceDataCache } from "./cache/reference-cache.js";

/**
 * Tool Registry
 *
 * Orchestrates registration of all MCP tools.
 * Phase 1 established the infrastructure.
 * Phase 2 added sales entity configs (7 entities, 42 tools).
 * Phase 3 added purchase entity configs (6 entities, 36 tools).
 * Phase 4 added banking + contact entity configs (5 entities, 28 factory tools + 2 custom archive tools = 30 tools).
 * Phase 5 added product entity configs (3 entities, 14 factory tools + 4 custom archive tools + 10 reference data tools = 28 tools).
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

  // Banking entities (Phase 4)
  // Each entity generates 6 tools: list, get, create, update, delete, update-status
  totalTools += registerCrudTools(server, client, bankMoneyInConfig);
  totalTools += registerCrudTools(server, client, bankMoneyOutConfig);
  totalTools += registerCrudTools(server, client, bankTransferConfig);

  // Contact entities (Phase 4)
  // Contact: 5 tools (no status — archive handled by custom tools)
  // Contact group: 5 tools (no status — groups have no status operations)
  totalTools += registerCrudTools(server, client, contactConfig);
  totalTools += registerCrudTools(server, client, contactGroupConfig);

  // Custom contact archive tools (Phase 4) — 2 tools
  totalTools += registerContactArchiveTools(server, client);

  // Product entities (Phase 5)
  // Product: 5 tools (no status — archive handled by custom tools)
  // Product bundle: 4 tools (no list — use list-products with type=bundle; no status — archive handled by custom tools)
  // Product group: 5 tools (no status — groups have no archive)
  totalTools += registerCrudTools(server, client, productConfig);
  totalTools += registerCrudTools(server, client, productBundleConfig);
  totalTools += registerCrudTools(server, client, productGroupConfig);

  // Custom product archive tools (Phase 5) — 4 tools
  totalTools += registerProductArchiveTools(server, client);

  // Reference data list tools (Phase 5) — 10 tools
  // Uses transparent cache with 5-minute TTL for reference data
  const referenceCache = new ReferenceDataCache();
  totalTools += registerReferenceDataTools(server, client, referenceCache);

  return totalTools;
}
