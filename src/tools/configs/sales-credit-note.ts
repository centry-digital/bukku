import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Sales Credit Note Entity Configuration
 *
 * API: /sales/credit_notes
 * Response keys: transaction (singular), transactions (plural)
 */
export const salesCreditNoteConfig: CrudEntityConfig = {
  entity: "sales-credit-note",
  apiBasePath: "/sales/credit_notes",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "sales credit note",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "email_status"],
  businessRules: {
    delete: "Only draft and void credit notes can be deleted. Ready or pending approval credit notes cannot be deleted — use update-sales-credit-note-status to void a ready credit note instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void credit note is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
};
