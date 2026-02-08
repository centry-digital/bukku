import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Sales Invoice Entity Configuration
 *
 * API: /sales/invoices
 * Response keys: transaction (singular), transactions (plural)
 */
export const salesInvoiceConfig: CrudEntityConfig = {
  entity: "sales-invoice",
  apiBasePath: "/sales/invoices",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "sales invoice",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "email_status", "transfer_status", "payment_status"],
  businessRules: {
    delete: "Only draft and void invoices can be deleted. Ready or pending approval invoices cannot be deleted — use update-sales-invoice-status to void a ready invoice instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void invoice is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
};
