import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Product Bundle Entity Configuration
 *
 * API: /products/bundles
 * Response keys: bundle (singular), bundles (plural) — custom wrapper keys
 * Bundles aggregate multiple products with optional discounts.
 * Archive/unarchive is handled by separate custom tools (product-archive.ts),
 * NOT the factory status tool, because the API expects { is_archived: boolean }
 * instead of { status: string }.
 *
 * Cross-references:
 * - Use list-products to find product IDs for bundle items
 */
export const productBundleConfig: CrudEntityConfig = {
  entity: "product-bundle",
  apiBasePath: "/products/bundles",
  singularKey: "bundle",
  pluralKey: "bundles",
  description:
    "product bundle. Bundles aggregate multiple products with optional discounts. Use list-products to find product IDs for bundle items.",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false,
  listFilters: [],
  businessRules: {
    delete:
      "Only bundles that are not used in any transactions can be deleted.",
  },
};
