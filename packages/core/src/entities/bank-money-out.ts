import type { CrudEntityConfig } from "../types/bukku.js";

/**
 * Bank Money Out Entity Configuration
 *
 * API: /banking/expenses
 * Response keys: transaction (singular), transactions (plural)
 * Money Out represents outgoing cash transactions (payments, disbursements, etc.)
 * Shares the same status lifecycle as sales/purchase transactions.
 */
export const bankMoneyOutConfig: CrudEntityConfig = {
  entity: "bank-money-out",
  apiBasePath: "/banking/expenses",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "bank money out transaction",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "account_id", "email_status"],
  businessRules: {
    delete:
      "Only draft and void money out transactions can be deleted. Ready or pending approval transactions cannot be deleted — use update-bank-money-out-status to void a ready transaction instead.",
    statusTransitions:
      "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void transaction is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
  cliGroup: "banking",
};
