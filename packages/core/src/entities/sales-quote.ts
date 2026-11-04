import type { CrudEntityConfig } from "../types/bukku.js";
import { validateSalesTermItems } from "../validation/write-rules.js";
import { prepareSalesTerms, sendSalesTerms } from "../validation/sales-terms.js";

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
    delete:
      "Only draft and void quotes can be deleted. Ready or pending approval quotes cannot be deleted — use update-sales-quote-status to void a ready quote instead.",
    statusTransitions:
      "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void quote is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
    write:
      "Payment terms: send term_items, Bukku's current format: each item needs payment_due plus either term_id (an existing payment term: list-terms, or `bukku ref-data terms`) or a custom date YYYY-MM-DD. A top-level term_id is still accepted as an older alternative, but never together with term_items. A single term for 100% is also sent as a top-level term_id for compatibility; if Bukku refuses term_id the request is retried with term_items only. If the stored term_items differ from the request, the result carries a warnings field. Read stored terms from term_items.",
  },
  validateWrite: validateSalesTermItems,
  prepareWrite: prepareSalesTerms,
  sendWrite: sendSalesTerms,
  cliGroup: "sales",
};
