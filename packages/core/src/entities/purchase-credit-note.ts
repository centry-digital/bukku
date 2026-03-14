import type { CrudEntityConfig } from "../types/bukku.js";

/**
 * Purchase Credit Note Entity Configuration
 *
 * API: /purchases/credit_notes
 * Response keys: transaction (singular), transactions (plural)
 */
export const purchaseCreditNoteConfig: CrudEntityConfig = {
  entity: "purchase-credit-note",
  apiBasePath: "/purchases/credit_notes",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "purchase credit note",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "payment_status"],
  businessRules: {
    delete: "Only draft and void credit notes can be deleted. Ready or pending approval credit notes cannot be deleted — use update-purchase-credit-note-status to void a ready credit note instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void credit note is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
  cliGroup: "purchases",
};
