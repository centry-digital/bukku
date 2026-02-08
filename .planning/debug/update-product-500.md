---
status: verifying
trigger: "update-product returns 500 from Bukku API"
created: 2026-02-08T00:00:00Z
updated: 2026-02-08T00:10:00Z
symptoms_prefilled: true
---

## Current Focus

hypothesis: HTTP 500 errors hide validation failures - server should return 400 with details but returns 500 instead. Likely cause: undocumented required fields, incorrect data types, or constraint violations (e.g., invalid account IDs, tax code IDs)
test: Enhanced error logging to capture full response body from 500 errors, check if similar issue affects other entities
expecting: Response body contains validation details that transform.ts is not surfacing to user
next_action: Add detailed logging to bukku-client.ts to capture response body before throwing error

## Symptoms

expected: PUT /products/4 with valid product data returns 200 with updated product
actual: PUT /products/4 returns HTTP 500
errors: HTTP 500 from Bukku API servers
reproduction: Call update-product MCP tool with valid product data (name, is_selling, sale_account_id, is_buying, track_inventory, units array)
started: Current issue - create (POST) works, only update (PUT) fails

## Eliminated

## Evidence

- timestamp: 2026-02-08T00:01:00Z
  checked: OpenAPI spec for product PUT /products/{productId}
  found: Request body references reqUpdateProduct schema directly (line 108), response wraps in {product: ...} (line 116-118)
  implication: Request body should NOT be wrapped in entity key, but response is wrapped

- timestamp: 2026-02-08T00:02:00Z
  checked: OpenAPI spec for contact PUT /contacts/{contactId}
  found: Same pattern - requestBody references schema directly, response wraps in {contact: ...}
  implication: Consistent across entities - request unwrapped, response wrapped

- timestamp: 2026-02-08T00:03:00Z
  checked: OpenAPI spec for sales invoice PUT /sales/invoices/{transactionId}
  found: Same pattern - requestBody references schema directly, response wraps in {transaction: ...}
  implication: API consistently expects unwrapped request body, returns wrapped response

- timestamp: 2026-02-08T00:04:00Z
  checked: product-archive.ts custom tool using PATCH /products/{id}
  found: PATCH works successfully for products with {is_archived: boolean}
  implication: PATCH endpoint works, issue is specific to PUT endpoint

- timestamp: 2026-02-08T00:05:00Z
  checked: Factory pattern implementation in factory.ts line 176
  found: PUT call is straightforward: client.put(`${config.apiBasePath}/${params.id}`, params.data)
  implication: No obvious bug in client code - issue likely server-side or data validation

- timestamp: 2026-02-08T00:06:00Z
  checked: OpenAPI spec examples for reqCreateProduct vs reqUpdateProduct
  found: Multiple issues in examples - Create uses "groupIds" (camelCase), Update uses "group_ids" (snake_case); both have typo "date_t0" instead of "date_to"; Update requires "id" field in units array
  implication: OpenAPI spec examples have errors/inconsistencies, suggesting documentation is unreliable

- timestamp: 2026-02-08T00:07:00Z
  checked: transform.ts error handling for HTTP 500 responses
  found: Line 105-115 handles 500+ status codes but returns generic message, does NOT include response body
  implication: Validation errors or specific failure reasons from Bukku API are hidden from user - they only see "unexpected error occurred on Bukku's servers"

- timestamp: 2026-02-08T00:08:00Z
  checked: bukku-client.ts PUT implementation (line 92-105)
  found: Throws response object on !response.ok, but error transform receives response and calls .json() to get body
  implication: Body should be available, but 500 error handler doesn't log it - diagnostic information is being lost

## Resolution

root_cause: HTTP 500 errors from Bukku API's PUT /products/{id} endpoint hide actual validation failures. The error transformation code (transform.ts lines 105-115) returns a generic message without including the response body, making it impossible to diagnose what field/constraint is failing. The Bukku API likely has undocumented validation rules or the server is incorrectly returning 500 instead of 400 for validation failures.

fix: Enhanced error reporting for HTTP 500 errors:
1. Modified transform.ts to include full response body in 500 error messages
2. Added detailed logging to bukku-client.ts PUT method to log:
   - URL being called
   - Request body being sent
   - Response status code on failure
   - Full error response body
This will expose the actual validation error hidden inside the 500 response, allowing diagnosis of the real issue.

verification: Build successful. Next: Reproduce the update-product failure and examine stderr logs for the actual validation error message from Bukku API.
files_changed: ["src/errors/transform.ts", "src/client/bukku-client.ts"]
