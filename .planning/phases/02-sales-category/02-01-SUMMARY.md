---
phase: 02-sales-category
plan: 01
subsystem: sales-domain
tags: [entity-config, crud, sales-api, factory-pattern]

requires:
  - 01-04: "CRUD factory pattern and registry infrastructure"
provides:
  - "Entity configs for all 7 sales transaction types"
  - "42 MCP tools (6 tools × 7 entities) ready for registry wiring"
affects:
  - 02-02: "Next plan will wire these configs into the tool registry"
  - 02-03: "Integration tests will validate these entity configs"

tech-stack:
  added: []
  patterns:
    - "CrudEntityConfig objects for declarative tool generation"
    - "Entity-specific list filters from OpenAPI specs"

key-files:
  created:
    - src/tools/configs/sales-quote.ts
    - src/tools/configs/sales-order.ts
    - src/tools/configs/delivery-order.ts
    - src/tools/configs/sales-invoice.ts
    - src/tools/configs/sales-credit-note.ts
    - src/tools/configs/sales-payment.ts
    - src/tools/configs/sales-refund.ts
  modified: []

decisions:
  - key: "entity-specific-filters"
    choice: "Each entity config has its own listFilters array matching OpenAPI spec"
    rationale: "Different sales entities support different filter parameters - invoice has payment_status, payment has payment_mode, etc."
    alternatives: ["Use same filters for all entities", "Generate filters dynamically from API"]
  - key: "uniform-operations"
    choice: "All 7 sales entities support all 5 CRUD operations + status updates"
    rationale: "OpenAPI spec shows all sales transaction types support full CRUD + status changes"
    alternatives: ["Different operation sets per entity"]

metrics:
  duration: "91 seconds"
  completed: "2026-02-07"
---

# Phase 2 Plan 1: Sales Entity Configurations Summary

**One-liner:** Created 7 CrudEntityConfig objects mapping sales transaction APIs to factory pattern, enabling 42 MCP tools from declarative configuration.

## What Was Built

Created entity configuration files for all 7 sales transaction types in the Bukku API:

1. **Document-type entities** (Task 1):
   - Sales Quote (`/sales/quotes`) - filters: contact_id, email_status, transfer_status
   - Sales Order (`/sales/orders`) - filters: contact_id, email_status, transfer_status
   - Delivery Order (`/sales/delivery_orders`) - filters: contact_id, email_status, transfer_status
   - Sales Invoice (`/sales/invoices`) - filters: contact_id, email_status, transfer_status, payment_status

2. **Payment-related entities** (Task 2):
   - Sales Credit Note (`/sales/credit_notes`) - filters: contact_id, email_status
   - Sales Payment (`/sales/payments`) - filters: contact_id, payment_mode
   - Sales Refund (`/sales/refunds`) - filters: contact_id

Each config exports a `CrudEntityConfig` object that the factory pattern (from Phase 1) will consume to generate 6 MCP tools:
- `list-{entity}s` - Paginated list with entity-specific filters
- `get-{entity}` - Single item by ID
- `create-{entity}` - Create new item
- `update-{entity}` - Update existing item
- `delete-{entity}` - Delete item
- `update-{entity}-status` - Update status (draft → posted, etc.)

## Shared Configuration Pattern

All 7 configs share these common fields:
```typescript
singularKey: "transaction"      // API response wrapper for single item
pluralKey: "transactions"       // API response wrapper for lists
operations: ["list", "get", "create", "update", "delete"]
hasStatusUpdate: true           // All support status transitions
```

This uniformity validates the factory pattern assumption: sales entities follow consistent API patterns.

## Entity-Specific Filters

Each entity has filters matching its OpenAPI specification:
- **Quote, Order, Delivery Order:** contact_id, email_status, transfer_status
- **Invoice:** contact_id, email_status, transfer_status, payment_status (adds payment tracking)
- **Credit Note:** contact_id, email_status (simpler workflow)
- **Payment:** contact_id, payment_mode (payment-specific)
- **Refund:** contact_id only (minimal filters)

## Task Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create entity configs for document-type sales entities | 00301c2 | sales-quote.ts, sales-order.ts, delivery-order.ts, sales-invoice.ts |
| 2 | Create entity configs for credit notes, payments, and refunds | 5d62d55 | sales-credit-note.ts, sales-payment.ts, sales-refund.ts |

## Verification Results

**TypeScript Compilation:** ✓ Passed
- All 7 configs compile without errors
- Type-safe imports of `CrudEntityConfig` from `types/bukku.ts`

**Entity Names:** ✓ Validated
- Kebab-case convention: `sales-quote`, `sales-order`, `delivery-order`, etc.
- Matches tool naming pattern from Phase 1 decisions

**API Paths:** ✓ Validated
- All paths match Bukku API structure from OpenAPI specs
- Underscore in `delivery_orders` and `credit_notes` preserved (API requirement)

**List Filters:** ✓ Validated
- Each entity has filters matching its OpenAPI spec
- No duplicate or missing filters

## Decisions Made

**1. Entity-specific list filters**
- Each config declares its own `listFilters` array
- Filters derived from OpenAPI spec parameters for each endpoint
- Alternative considered: Dynamic filter generation from API responses
- **Rationale:** Explicit declaration is clearer and type-safe. Different entities genuinely have different filter capabilities.

**2. Uniform operation support**
- All 7 entities enable all 5 CRUD operations + status updates
- Alternative considered: Conditional operations based on API capabilities
- **Rationale:** OpenAPI research showed all sales entities support full CRUD + status changes. Uniformity simplifies mental model.

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Blockers:** None

**Concerns:** None - configs are ready for registry wiring

**Dependencies satisfied:**
- Phase 1 factory pattern exists and is tested
- `CrudEntityConfig` interface is defined in `types/bukku.ts`
- OpenAPI research provided accurate filter lists

**Next steps:**
- Plan 02-02: Wire these configs into the tool registry
- Plan 02-03: Integration test the generated tools against Bukku API
- These 7 configs will generate 42 MCP tools when registered

## Self-Check: PASSED

All created files exist:
- src/tools/configs/sales-quote.ts ✓
- src/tools/configs/sales-order.ts ✓
- src/tools/configs/delivery-order.ts ✓
- src/tools/configs/sales-invoice.ts ✓
- src/tools/configs/sales-credit-note.ts ✓
- src/tools/configs/sales-payment.ts ✓
- src/tools/configs/sales-refund.ts ✓

All commits exist:
- 00301c2 ✓
- 5d62d55 ✓
