import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Product Entity Configuration
 *
 * API: /products
 * Response keys: product (singular), products (plural) — NOT transaction/transactions
 * Products are non-transaction entities with custom wrapper keys.
 * Archive/unarchive is handled by separate custom tools (product-archive.ts),
 * NOT the factory status tool, because the API expects { is_archived: boolean }
 * instead of { status: string }.
 *
 * List filters:
 * - search: Text search across product name/code
 * - stock_level: Filter by stock level (low, medium, high)
 * - mode: Filter by product mode (sale, purchase, both)
 * - type: Filter by product type (tracked, untracked, service)
 * - include_archived: Boolean to include archived products in results
 *
 * Cross-references:
 * - Use list-tax-codes to find valid tax code IDs for sale_tax_code_id and purchase_tax_code_id
 * - Use list-accounts to find valid account IDs for sale_account_id, purchase_account_id, and inventory_account_id
 * - Use list-product-groups to find group IDs for group_ids array
 */
export const productConfig: CrudEntityConfig = {
  entity: "product",
  apiBasePath: "/products",
  singularKey: "product",
  pluralKey: "products",
  description:
    "product. Use list-tax-codes to find valid tax code IDs for sale_tax_code_id and purchase_tax_code_id. Use list-accounts to find valid account IDs for sale_account_id, purchase_account_id, and inventory_account_id. Use list-product-groups to find group IDs for group_ids.",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false,
  listFilters: ["search", "stock_level", "mode", "type", "include_archived"],
  businessRules: {
    delete:
      "Only products that are not used in any transactions can be deleted. Archive instead if the product has transaction history.",
  },
};
