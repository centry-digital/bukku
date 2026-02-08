---
status: resolved
trigger: "list-product-bundles returns 404"
created: 2026-02-08T00:00:00Z
updated: 2026-02-08T00:00:00Z
---

## Current Focus

hypothesis: Configuration error - bundle config includes "list" operation but API doesn't support GET /products/bundles
test: Verified OpenAPI spec and found alternative solution
expecting: Remove "list" from operations, users can use list-products with type=bundle filter
next_action: complete

## Symptoms

expected: list-product-bundles tool should return bundle list
actual: HTTP 404 error when calling list-product-bundles
errors: 404 Not Found from GET /products/bundles
reproduction: Call list-product-bundles MCP tool
started: Since implementation - API never supported listing bundles at this endpoint

## Eliminated

N/A - Root cause confirmed on first investigation

## Evidence

- timestamp: 2026-02-08T00:00:00Z
  checked: /Users/ylchow/Centry/bukku-mcp/.api-specs/product.yaml lines 175-204
  found: /products/bundles only has POST method defined, no GET method
  implication: API does not support listing bundles at /products/bundles endpoint

- timestamp: 2026-02-08T00:00:00Z
  checked: /Users/ylchow/Centry/bukku-mcp/.api-specs/product.yaml lines 305-339
  found: /products/groups has both POST and GET methods defined
  implication: Groups support listing at collection endpoint, but bundles do not

- timestamp: 2026-02-08T00:00:00Z
  checked: /Users/ylchow/Centry/bukku-mcp/.api-specs/product.yaml lines 473-481
  found: GET /products has a "type" query parameter with enum values ["product", "bundle"]
  implication: Bundles can be listed via GET /products?type=bundle instead

- timestamp: 2026-02-08T00:00:00Z
  checked: /Users/ylchow/Centry/bukku-mcp/src/tools/configs/product-bundle.ts line 23
  found: operations array includes "list"
  implication: Configuration incorrectly declares list operation as supported

- timestamp: 2026-02-08T00:00:00Z
  checked: /Users/ylchow/Centry/bukku-mcp/src/tools/factory.ts lines 39-90
  found: Factory generates GET request to config.apiBasePath when "list" is in operations
  implication: Factory correctly generates GET /products/bundles for list-product-bundles tool, but API rejects it

## Resolution

root_cause: The productBundleConfig incorrectly includes "list" in its operations array, but the Bukku API does not support GET /products/bundles. The OpenAPI spec shows only POST is available at this endpoint. Bundles are designed to be listed through the main products endpoint using the type=bundle filter parameter.

fix: Remove "list" from productBundleConfig.operations array. Users should use list-products tool with type=bundle filter to list bundles.

verification:
- OpenAPI spec confirmed: /products/bundles has no GET method (only POST)
- OpenAPI spec confirmed: /products GET supports type query parameter with "bundle" as valid value
- Alternative verified: list-products?type=bundle is the correct way to list bundles

files_changed:
- /Users/ylchow/Centry/bukku-mcp/src/tools/configs/product-bundle.ts

## Recommended Fix

Update productBundleConfig in `/Users/ylchow/Centry/bukku-mcp/src/tools/configs/product-bundle.ts`:

**Before:**
```typescript
operations: ["list", "get", "create", "update", "delete"],
```

**After:**
```typescript
operations: ["get", "create", "update", "delete"],
```

**Update the description to guide users:**
```typescript
description:
  "product bundle. Bundles aggregate multiple products with optional discounts. Use list-products with type=bundle to list bundles. Use list-products to find product IDs for bundle items.",
```

**Update the cross-references comment:**
```typescript
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
 * - Use list-products with type=bundle to list bundles
 * - Use list-products to find product IDs for bundle items
 */
```

## Why This Happens

The Bukku API design pattern differs between entity types:
- **Product Groups**: Supports GET /products/groups (list endpoint at collection level)
- **Product Bundles**: Does NOT support GET /products/bundles, instead bundles are listed through GET /products?type=bundle

This is an API design decision - bundles are treated as a special type of product rather than a separate collection. The MCP configuration must align with this API design.
