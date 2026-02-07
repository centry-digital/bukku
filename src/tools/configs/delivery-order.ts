import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Delivery Order Entity Configuration
 *
 * API: /sales/delivery_orders
 * Response keys: transaction (singular), transactions (plural)
 */
export const deliveryOrderConfig: CrudEntityConfig = {
  entity: "delivery-order",
  apiBasePath: "/sales/delivery_orders",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "delivery order",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "email_status", "transfer_status"],
};
