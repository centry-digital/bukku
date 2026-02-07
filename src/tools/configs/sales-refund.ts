import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Sales Refund Entity Configuration
 *
 * API: /sales/refunds
 * Response keys: transaction (singular), transactions (plural)
 */
export const salesRefundConfig: CrudEntityConfig = {
  entity: "sales-refund",
  apiBasePath: "/sales/refunds",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "sales refund",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id"],
};
