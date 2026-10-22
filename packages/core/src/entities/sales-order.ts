import type { CrudEntityConfig } from "../types/bukku.js";
import { validateSalesTermItems } from "../validation/write-rules.js";

/**
 * Sales Order Entity Configuration
 *
 * API: /sales/orders
 * Response keys: transaction (singular), transactions (plural)
 */
export const salesOrderConfig: CrudEntityConfig = {
  entity: "sales-order",
  apiBasePath: "/sales/orders",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "sales order",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "email_status", "transfer_status"],
  businessRules: {
    delete:
      "Only draft and void orders can be deleted. Ready or pending approval orders cannot be deleted — use update-sales-order-status to void a ready order instead.",
    statusTransitions:
      "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void order is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
    write:
      "Payment terms: send a top-level term_id (an existing payment term: list-terms, or `bukku ref-data terms`), which is what Bukku applies today. Bukku has announced term_items as its replacement: each item needs payment_due plus either term_id or a custom date (YYYY-MM-DD); it is accepted here, but at present Bukku ignores it. Do not send both. Read stored terms from term_items in responses.",
  },
  validateWrite: validateSalesTermItems,
  cliGroup: "sales",
};
