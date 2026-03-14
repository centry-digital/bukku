import type { CrudEntityConfig } from "../types/bukku.js";

/**
 * Purchase Bill Entity Configuration
 *
 * API: /purchases/bills
 * Response keys: transaction (singular), transactions (plural)
 * Note: payment_mode filter includes 'claim' option for expense claims/reimbursements
 */
export const purchaseBillConfig: CrudEntityConfig = {
  entity: "purchase-bill",
  apiBasePath: "/purchases/bills",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "purchase bill",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "payment_status", "payment_mode"],
  businessRules: {
    delete: "Only draft and void bills can be deleted. Ready or pending approval bills cannot be deleted — use update-purchase-bill-status to void a ready bill instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void bill is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
  cliGroup: "purchases",
};
