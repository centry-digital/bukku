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
};
