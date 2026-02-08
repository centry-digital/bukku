import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Sales Order Entity Configuration
 *
 * API: /sales/orders
 * Response keys: transaction (singular), transactions (plural)
 */
export const salesOrderConfig: CrudEntityConfig = {
  entity: "sales-order",
  apiBasePath: "/sales/orders",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "sales order",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "email_status", "transfer_status"],
  businessRules: {
    delete: "Only draft orders can be deleted. Ready or void orders cannot be deleted — use update-sales-order-status to void a ready order instead.",
    statusTransitions: "Valid transitions: draft -> ready, ready -> void. A void order is final and cannot be changed. There is no way to revert a ready or void order back to draft.",
  },
};
