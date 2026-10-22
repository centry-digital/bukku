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
      "Payment terms go in term_items, not a top-level term_id: each item needs payment_due plus either term_id (an existing payment term: list-terms, or `bukku ref-data terms`) or a custom date (YYYY-MM-DD); description is optional. Responses carry payment terms only in term_items (no term_id, term_name or due_date).",
  },
  validateWrite: validateSalesTermItems,
  cliGroup: "sales",
};
