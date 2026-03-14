import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BukkuClient } from 'core';
import { registerCrudTools } from "./factory.js";

// All entity configs from core
import {
  salesQuoteConfig, salesOrderConfig, deliveryOrderConfig,
  salesInvoiceConfig, salesCreditNoteConfig, salesPaymentConfig, salesRefundConfig,
  purchaseOrderConfig, goodsReceivedNoteConfig, purchaseBillConfig,
  purchaseCreditNoteConfig, purchasePaymentConfig, purchaseRefundConfig,
  bankMoneyInConfig, bankMoneyOutConfig, bankTransferConfig,
  contactConfig, contactGroupConfig,
  productConfig, productBundleConfig, productGroupConfig,
  journalEntryConfig, accountConfig,
  fileConfig,
  locationConfig, tagConfig, tagGroupConfig,
  ReferenceDataCache,
} from 'core';

// Custom tools (local within mcp)
import { registerContactArchiveTools } from "./custom/contact-archive.js";
import { registerProductArchiveTools } from "./custom/product-archive.js";
import { registerReferenceDataTools } from "./custom/reference-data.js";
import { registerJournalEntryTools } from "./custom/journal-entry-tools.js";
import { registerAccountCustomTools } from "./custom/account-tools.js";
import { registerFileUploadTool } from "./custom/file-upload.js";
import { registerLocationTools } from "./custom/location-tools.js";
import { registerControlPanelArchiveTools } from "./custom/control-panel-archive.js";

/**
 * Tool Registry
 *
 * Orchestrates registration of all MCP tools.
 * Phase 1 established the infrastructure.
 * Phase 2 added sales entity configs (7 entities, 42 tools).
 * Phase 3 added purchase entity configs (6 entities, 36 tools).
 * Phase 4 added banking + contact entity configs (5 entities, 28 factory tools + 2 custom archive tools = 30 tools).
 * Phase 5 added product entity configs (3 entities, 14 factory tools + 4 custom archive tools + 10 reference data tools = 28 tools).
 * Phase 6 added accounting entity configs (2 entities, 8 factory tools + 2 custom journal tools + 3 custom account tools = 13 tools).
 * Phase 7 added file + control panel entity configs (4 entities, 14 factory tools + 1 custom upload tool + 3 custom location tools + 2 custom archive tools = 20 tools).
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

  // Accounting entities (Phase 6)
  // Journal entry: 4 factory tools (list, get, delete, update-status) — create/update handled by custom tools with validation
  totalTools += registerCrudTools(server, client, journalEntryConfig);
  // Account: 4 factory tools (get, create, update, delete) — no list (use Phase 5 list-accounts or search-accounts)
  totalTools += registerCrudTools(server, client, accountConfig);

  // Custom journal entry tools (Phase 6) — 2 tools (create, update with double-entry validation)
  totalTools += registerJournalEntryTools(server, client);

  // Custom account tools (Phase 6) — 3 tools (search-accounts, archive-account, unarchive-account)
  totalTools += registerAccountCustomTools(server, client);

  // File entity (Phase 7)
  // File: 2 factory tools (list, get) — no create/update/delete (files are immutable, upload handled by custom tool)
  totalTools += registerCrudTools(server, client, fileConfig);

  // Custom file upload tool (Phase 7) — 1 tool (multipart/form-data upload)
  totalTools += registerFileUploadTool(server, client);

  // Control panel entities (Phase 7)
  // Location: 2 factory tools (list, create) — get/update/delete use singular /location/{id} path, handled by custom tools
  totalTools += registerCrudTools(server, client, locationConfig);

  // Custom location tools (Phase 7) — 3 tools (get, update, delete with singular /location/{id} path)
  totalTools += registerLocationTools(server, client);

  // Tag: 5 factory tools (list, get, create, update, delete)
  totalTools += registerCrudTools(server, client, tagConfig);

  // Tag group: 5 factory tools (list, get, create, update, delete)
  totalTools += registerCrudTools(server, client, tagGroupConfig);

  // Custom control panel archive tools (Phase 7) — 2 tools (archive/unarchive for locations only)
  totalTools += registerControlPanelArchiveTools(server, client);

  return totalTools;
}
