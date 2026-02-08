import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Sales Payment Entity Configuration
 *
 * API: /sales/payments
 * Response keys: transaction (singular), transactions (plural)
 */
export const salesPaymentConfig: CrudEntityConfig = {
  entity: "sales-payment",
  apiBasePath: "/sales/payments",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "sales payment",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "payment_mode"],
  businessRules: {
    delete: "Only draft and void payments can be deleted. Ready or pending approval payments cannot be deleted — use update-sales-payment-status to void a ready payment instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void payment is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
};
