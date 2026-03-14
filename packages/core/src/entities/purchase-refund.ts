import type { CrudEntityConfig } from "../types/bukku.js";

/**
 * Purchase Refund Entity Configuration
 *
 * API: /purchases/refunds
 * Response keys: transaction (singular), transactions (plural)
 */
export const purchaseRefundConfig: CrudEntityConfig = {
  entity: "purchase-refund",
  apiBasePath: "/purchases/refunds",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "purchase refund",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "email_status", "payment_status", "account_id"],
  businessRules: {
    delete: "Only draft and void refunds can be deleted. Ready or pending approval refunds cannot be deleted — use update-purchase-refund-status to void a ready refund instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void refund is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
  cliGroup: "purchases",
};
