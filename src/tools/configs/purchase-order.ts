import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Purchase Order Entity Configuration
 *
 * API: /purchases/orders
 * Response keys: transaction (singular), transactions (plural)
 */
export const purchaseOrderConfig: CrudEntityConfig = {
  entity: "purchase-order",
  apiBasePath: "/purchases/orders",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "purchase order",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "email_status", "transfer_status"],
  businessRules: {
    delete: "Only draft and void purchase orders can be deleted. Ready or pending approval purchase orders cannot be deleted — use update-purchase-order-status to void a ready purchase order instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void purchase order is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
};
