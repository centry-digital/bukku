---
status: issues-found
phase: 02-sales-category
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md]
started: 2026-02-08
updated: 2026-02-08
---

## Tests

### 1. MCP Server Starts and Registers 42 Tools
expected: Running the MCP server starts without errors and logs that 42 tools are registered. The server connects via stdio transport.
result: PASS

### 2. List Sales Invoices
expected: Using the `list-sales-invoices` tool returns a paginated list of sales invoices from your Bukku account. Results include invoice data (number, date, amount, status, contact).
result: PASS

### 3. List Sales Invoices with Filters
expected: Using `list-sales-invoices` with filters (e.g., payment_status, contact_id, or date range via search) returns filtered results matching the criteria.
result: PASS

### 4. Get a Single Sales Invoice
expected: Using `get-sales-invoice` with a valid invoice ID returns the full invoice details including line items, totals, and status.
result: PASS

### 5. Create a Sales Invoice
expected: Using `create-sales-invoice` with valid data (contact, line items, date) creates a new invoice in Bukku. The response contains the created invoice with an ID.
result: PASS

### 6. Update a Sales Invoice
expected: Using `update-sales-invoice` with an invoice ID and changed fields (e.g., updating a note or line item) successfully updates the invoice in Bukku.
result: PASS

### 7. Update Sales Invoice Status
expected: Using `update-sales-invoice-status` transitions the invoice status (e.g., from draft to posted/approved). The response reflects the new status.
result: PASS

### 8. Delete a Sales Invoice
expected: Using `delete-sales-invoice` with an invoice ID removes the invoice from Bukku (or marks it as deleted). Subsequent get returns not found or deleted status.
result: ISSUE
severity: medium
details: |
  When deleting a ready-status invoice, Bukku API rejects the request (ready invoices cannot be deleted).
  The MCP offered two recovery options: (1) void the invoice, (2) revert to draft then delete.
  However, Option 2 is not viable — once an invoice is set to ready, it cannot be reverted to draft.
  The MCP should detect the ready status and only suggest voiding as the recovery path.
  Business rule: ready invoices can only be voided, not deleted or reverted to draft.

### 9. List Other Sales Entity Types
expected: Tools for other sales entities work: `list-sales-quotes`, `list-sales-orders`, `list-delivery-orders`, `list-sales-credit-notes`, `list-sales-payments`, `list-sales-refunds` each return data from their respective endpoints.
result: PASS

### 10. Tool Error Handling
expected: Using a tool with invalid data (e.g., creating an invoice with missing required fields, or getting a non-existent ID) returns a clear, conversational error message explaining what went wrong and how to fix it.
result: PASS

## Summary

total: 10
passed: 9
issues: 1
pending: 0
skipped: 0

## Gaps

### GAP-01: Delete tool lacks business-rule-aware error recovery
severity: medium
source: Test 8
description: |
  When a user attempts to delete a ready-status invoice, the error transformer or tool description
  should guide the LLM to only suggest voiding (not reverting to draft). This is a Bukku business rule:
  once an invoice reaches "ready" status, it cannot revert to draft — it can only be voided.

  This likely affects all sales entities with similar status lifecycle constraints, not just invoices.

  Fix approach: Add business-rule context to the delete tool descriptions or error transformer so
  the LLM knows which recovery options are actually viable based on document status.
