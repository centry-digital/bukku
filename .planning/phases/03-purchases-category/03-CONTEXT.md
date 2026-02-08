# Phase 3: Purchases Category - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete purchasing workflow tools (purchase orders, goods received notes, bills, credit notes, payments, refunds) using the validated factory pattern from Phase 2. Also fix sales business rules that were discovered to be inaccurate during this discussion.

</domain>

<decisions>
## Implementation Decisions

### Entity structure
- 6 purchase entities (no quote equivalent): purchase order, goods received note, bill, credit note, payment, refund
- All 6 support uniform operations: list, get, create, update, delete, update-status (36 tools total)
- All use `transaction`/`transactions` as response wrapper keys (same as sales)

### API endpoint & filter parity
- Follow the OpenAPI spec exactly for each entity's available filters
- Purchase Order: `contact_id`, `email_status`, `transfer_status`
- Goods Received Note: `contact_id`, `email_status`, `transfer_status`
- Bill: `contact_id`, `email_status`, `payment_status`, `payment_mode` (credit/cash/claim — 'claim' is purchase-specific for expense claims)
- Credit Note: `contact_id`, `email_status`, `payment_status`
- Payment: `contact_id`, `email_status`, `payment_status`, `account_id`
- Refund: `contact_id`, `email_status`, `payment_status`, `account_id`
- Standard filters (search, date_from, date_to, status, page, page_size, sort_by, sort_dir) handled by factory

### Naming & tool descriptions
- Entity names match Bukku API naming: `purchase-order`, `goods-received-note`, `purchase-bill`, `purchase-credit-note`, `purchase-payment`, `purchase-refund`
- Keep full 'goods-received-note' name (no abbreviation to GRN)
- Tool names follow existing pattern: `list-purchase-orders`, `create-goods-received-note`, `update-purchase-bill-status`, etc.
- Descriptions mirror sales style: "List purchase bills with optional filters", "Create a new purchase order"

### Business rules (CORRECTED — applies to BOTH sales and purchases)
- **Delete constraint:** Only draft and void transactions can be deleted (NOT draft-only as Phase 2 currently states)
- **Status lifecycle:** draft -> ready (direct), OR draft -> pending_approval -> ready (via approval). ready -> void (final). No backward transitions.
- `pending_approval` is a valid status missing from current sales business rules
- Fix sales business rules as part of this phase to match the corrected rules

### Claude's Discretion
- Config file organization within src/tools/configs/
- Whether to create a shared purchase config directory or keep flat
- Order of entity registration in registry

</decisions>

<specifics>
## Specific Ideas

- Sales business rules need correction: update delete constraint to "draft and void" and add `pending_approval` to status lifecycle
- Payment mode 'claim' is purchase-specific (expense claims/reimbursements) — worth noting in tool description

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-purchases-category*
*Context gathered: 2026-02-08*
