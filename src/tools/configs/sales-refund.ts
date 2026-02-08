import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Sales Refund Entity Configuration
 *
 * API: /sales/refunds
 * Response keys: transaction (singular), transactions (plural)
 */
export const salesRefundConfig: CrudEntityConfig = {
  entity: "sales-refund",
  apiBasePath: "/sales/refunds",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "sales refund",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id"],
  businessRules: {
    delete: "Only draft and void refunds can be deleted. Ready or pending approval refunds cannot be deleted — use update-sales-refund-status to void a ready refund instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void refund is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
};
