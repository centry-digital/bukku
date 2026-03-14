import type { CrudEntityConfig } from "../types/bukku.js";

/**
 * Bank Money In Entity Configuration
 *
 * API: /banking/incomes
 * Response keys: transaction (singular), transactions (plural)
 * Money In represents incoming cash transactions (deposits, receipts, etc.)
 * Shares the same status lifecycle as sales/purchase transactions.
 */
export const bankMoneyInConfig: CrudEntityConfig = {
  entity: "bank-money-in",
  apiBasePath: "/banking/incomes",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "bank money in transaction",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "account_id", "email_status"],
  businessRules: {
    delete:
      "Only draft and void money in transactions can be deleted. Ready or pending approval transactions cannot be deleted — use update-bank-money-in-status to void a ready transaction instead.",
    statusTransitions:
      "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void transaction is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
  cliGroup: "banking",
};
