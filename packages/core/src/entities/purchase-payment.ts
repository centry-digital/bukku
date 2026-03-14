import type { CrudEntityConfig } from "../types/bukku.js";

/**
 * Purchase Payment Entity Configuration
 *
 * API: /purchases/payments
 * Response keys: transaction (singular), transactions (plural)
 */
export const purchasePaymentConfig: CrudEntityConfig = {
  entity: "purchase-payment",
  apiBasePath: "/purchases/payments",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "purchase payment",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "email_status", "payment_status", "account_id"],
  businessRules: {
    delete: "Only draft and void payments can be deleted. Ready or pending approval payments cannot be deleted — use update-purchase-payment-status to void a ready payment instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void payment is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
  cliGroup: "purchases",
};
