import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Bank Transfer Entity Configuration
 *
 * API: /banking/transfers
 * Response keys: transaction (singular), transactions (plural)
 * Transfers are account-to-account movements (no contact involved).
 * Has fewer list filters than money in/out — only account_id (no contact_id, no email_status).
 * Shares the same status lifecycle as other banking/sales/purchase transactions.
 */
export const bankTransferConfig: CrudEntityConfig = {
  entity: "bank-transfer",
  apiBasePath: "/banking/transfers",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "bank transfer",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["account_id"],
  businessRules: {
    delete:
      "Only draft and void transfers can be deleted. Ready or pending approval transfers cannot be deleted — use update-bank-transfer-status to void a ready transfer instead.",
    statusTransitions:
      "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void transfer is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
};
