import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Sales Payment Entity Configuration
 *
 * API: /sales/payments
 * Response keys: transaction (singular), transactions (plural)
 */
export const salesPaymentConfig: CrudEntityConfig = {
  entity: "sales-payment",
  apiBasePath: "/sales/payments",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "sales payment",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "payment_mode"],
};
