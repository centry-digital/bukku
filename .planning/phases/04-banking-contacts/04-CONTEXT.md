# Phase 4: Banking & Contacts - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Banking transaction tools (money in, money out, transfers) and contact management (contacts, contact groups) using the proven CRUD factory pattern. Enables financial reconciliation workflows and customer/supplier management. All entities follow the established CrudEntityConfig pattern from Phases 2-3.

</domain>

<decisions>
## Implementation Decisions

### Banking tool naming
- All banking tools use `bank-` prefix: `list-bank-money-in`, `create-bank-money-in`, `get-bank-money-in`, `update-bank-money-in`, `delete-bank-money-in`, `update-bank-money-in-status`
- Money out follows same pattern: `list-bank-money-out`, `create-bank-money-out`, etc.
- Transfers: `list-bank-transfers`, `create-bank-transfer`, `get-bank-transfer`, `update-bank-transfer`, `delete-bank-transfer`, `update-bank-transfer-status`
- API paths: `/banking/incomes` (money in), `/banking/expenses` (money out), `/banking/transfers`

### Contact status handling
- Contacts use archive/unarchive (PATCH with `is_archived: true/false`) — Claude decides how to map this to MCP tools (update-status pattern or dedicated archive tool)
- Contact groups have CRUD only — no status tool (API has no status endpoint for groups)
- list-contacts exposes `status` filter with values: ALL, ACTIVE, INACTIVE (default returns ACTIVE only)
- list-contacts exposes all available filters: search, status, type (customer/supplier/employee), group_id, is_myinvois_ready, page, page_size

### Transfer entity differences
- Each banking entity gets entity-specific filter lists matching what the API actually supports
- Money in/out list filters: date_from, date_to, search, contact_id, account_id, status, email_status, page, page_size, sort_by, sort_dir
- Transfer list filters: date_from, date_to, search, account_id, status (no contact_id, no email_status, no page/page_size, no sort params)
- Banking status lifecycle (draft/ready/void transitions, delete constraints) must be researched — do NOT assume same as sales/purchases
- Research all three banking entities (money in, money out, transfers) separately for business rules

### Contact delete constraints
- Tool description uses proactive warning: "Only contacts with no linked transactions can be deleted. Archive instead if the contact has transaction history."
- Contact groups: no delete constraint — allow delete freely
- Banking transaction delete constraints: let research determine actual rules (do not assume draft+void from sales/purchases)

### Claude's Discretion
- How to map contact archive/unarchive to MCP tool pattern (update-status vs dedicated tool)
- Banking entity config structure and TypeScript types
- Tool description wording for banking entities
- Registration order in registry

</decisions>

<specifics>
## Specific Ideas

- Banking entities follow Bukku's UI terminology: "Money In" and "Money Out" (not income/expense)
- Contacts have rich schema with Malaysia-specific fields (entity_type, MyInvois, SST reg no) — these are part of the flexible data input, not separate tools
- Contact groups are simple (name + contact_ids) — minimal config needed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-banking-contacts*
*Context gathered: 2026-02-08*
