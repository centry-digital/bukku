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
};
