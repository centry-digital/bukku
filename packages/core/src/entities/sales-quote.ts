import type { CrudEntityConfig } from "../types/bukku.js";

/**
 * Sales Quote Entity Configuration
 *
 * API: /sales/quotes
 * Response keys: transaction (singular), transactions (plural)
 */
export const salesQuoteConfig: CrudEntityConfig = {
  entity: "sales-quote",
  apiBasePath: "/sales/quotes",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "sales quote",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "email_status", "transfer_status"],
  businessRules: {
    delete: "Only draft and void quotes can be deleted. Ready or pending approval quotes cannot be deleted — use update-sales-quote-status to void a ready quote instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void quote is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
  cliGroup: "sales",
};
