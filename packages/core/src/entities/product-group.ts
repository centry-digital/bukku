import type { CrudEntityConfig } from "../types/bukku.js";

/**
 * Product Group Entity Configuration
 *
 * API: /products/groups
 * Response keys: group (singular), groups (plural)
 * Groups organize products into categories.
 * Simplest entity config — no status operations, no entity-specific filters,
 * no business rules. Factory provides base pagination parameters.
 *
 * Cross-references:
 * - Use list-products to find product IDs for the product_ids array
 */
export const productGroupConfig: CrudEntityConfig = {
  entity: "product-group",
  apiBasePath: "/products/groups",
  singularKey: "group",
  pluralKey: "groups",
  description:
    "product group. Groups organize products into categories. Use list-products to find product IDs for the product_ids array.",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false,
  listFilters: [],
  cliGroup: "products",
};
