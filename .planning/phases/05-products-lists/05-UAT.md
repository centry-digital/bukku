---
status: diagnosed
phase: 05-products-lists
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md
started: 2026-02-08T22:30:00Z
updated: 2026-02-08T22:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. List Products
expected: list-products tool returns paginated product list with filters (search, stock_level, mode, type, include_archived)
result: pass

### 2. Create a Product
expected: create-product tool sends data to Bukku and returns newly created product with an ID
result: pass

### 3. Get a Product by ID
expected: get-product returns full product record by ID
result: pass

### 4. Update a Product
expected: update-product sends changes and returns updated product
result: issue
reported: "Bukku API returns 500 Internal Server Error on every PUT /products/{id} attempt. Tried multiple payload formats with all required fields (name, is_selling, sale_account_id, is_buying, track_inventory, units with id/label/rate/sale_price/is_base/is_sale_default/is_purchase_default). MCP tool makes correct request — server-side failure."
severity: major

### 5. Delete a Product
expected: delete-product confirms deletion for products without transaction history
result: pass

### 6. Archive and Unarchive a Product
expected: archive-product sets is_archived=true, unarchive-product restores to is_archived=false
result: pass

### 7. Product Bundles CRUD
expected: list, create, get, update, delete bundles using appropriate bundle tools
result: issue
reported: "list-product-bundles returns 404. The Bukku OpenAPI spec (product.yaml) confirms /products/bundles only has POST (create), no GET (list) endpoint. The factory generated a list tool for a non-existent API endpoint. Create, get, and delete work correctly."
severity: major

### 8. Archive and Unarchive a Product Bundle
expected: archive-product-bundle and unarchive-product-bundle toggle is_archived
result: pass

### 9. Product Groups CRUD
expected: list, create, get, update, delete product groups using appropriate group tools
result: pass

### 10. List Reference Data (Tax Codes)
expected: list-tax-codes returns tax codes from Bukku account
result: pass

### 11. List Reference Data (Currencies, Payment Methods)
expected: list-currencies and list-payment-methods return appropriate reference data
result: pass

### 12. Reference Data Caching
expected: Second call to same reference data within 5 minutes returns cached data
result: pass

### 13. Server Reports 137 Tools
expected: Server logs 137 tools registered on startup
result: pass

## Summary

total: 13
passed: 11
issues: 2
pending: 0
skipped: 0

## Gaps

- truth: "update-product sends changes and returns updated product"
  status: failed
  reason: "User reported: Bukku API returns 500 Internal Server Error on every PUT /products/{id} attempt. Tried multiple payload formats with all required fields. MCP tool makes correct request — server-side failure."
  severity: major
  test: 4
  root_cause: "HTTP 500 errors from Bukku API hide actual validation failures. The error transformation code returned a generic message without the response body, making root cause invisible. Enhanced 500 error handler to include response body so the actual Bukku validation error is surfaced. Likely an undocumented API constraint or Bukku returning 500 for what should be 400."
  artifacts:
    - path: "src/errors/transform.ts"
      issue: "500 handler now includes response body for debugging"
  missing:
    - "Include response body in 500 error messages to expose hidden validation errors"
  debug_session: ".planning/debug/update-product-500.md"

- truth: "list-product-bundles returns paginated list of bundles"
  status: failed
  reason: "User reported: list-product-bundles returns 404. The Bukku OpenAPI spec confirms /products/bundles only has POST (create), no GET (list) endpoint. The factory generated a list tool for a non-existent API endpoint."
  severity: major
  test: 7
  root_cause: "productBundleConfig incorrectly includes 'list' in operations array. The Bukku API has no GET /products/bundles endpoint — bundles are listed via GET /products?type=bundle. The OpenAPI spec confirms /products/bundles only supports POST (create)."
  artifacts:
    - path: "src/tools/configs/product-bundle.ts"
      issue: "Line 23: operations array includes 'list' but API has no list endpoint for bundles"
  missing:
    - "Remove 'list' from bundle config operations array"
    - "Update bundle description to guide users: use list-products with type=bundle"
  debug_session: ".planning/debug/list-bundles-404.md"
