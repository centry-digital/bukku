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
  businessRules: {
    delete: "Only draft and void delivery orders can be deleted. Ready or pending approval delivery orders cannot be deleted — use update-delivery-order-status to void a ready delivery order instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void delivery order is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
};
