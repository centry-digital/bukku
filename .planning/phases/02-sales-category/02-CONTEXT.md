# Phase 2: Sales Category (Proof of Concept) - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete CRUD tools for 7 sales entities (quotes, orders, delivery orders, invoices, credit notes, payments, refunds) with list/create/get/update/delete + update-status operations. This phase validates the factory pattern end-to-end with real Bukku API calls and establishes tool description standards for scaling to other categories. No composite workflow tools — Claude orchestrates multi-step workflows conversationally.

</domain>

<decisions>
## Implementation Decisions

### Tool granularity
- All 6 tools per entity (list, create, get, update, delete, update-status) for all 7 sales entities — no exceptions
- Claude's Discretion: whether to use separate tools per operation or consolidate into fewer tools with action parameters (user is fine either way)
- Tool names use Bukku API resource names in kebab-case: `list-sales-invoices`, `create-sales-credit-notes`, `update-status-delivery-orders`, etc.
- Tool descriptions are purely functional (e.g., "List sales invoices with optional filters.") — no workflow context in descriptions

### Filter & search design
- All 7 entities share the same uniform filter set: search, date range (date_from, date_to), status, pagination (page, page_size)
- Claude's Discretion: whether filters are individual parameters or a filter object
- Date format: ISO dates (YYYY-MM-DD) — no flexible/natural date parsing
- Default page size: 25 items when user doesn't specify

### Status transitions
- Relay API errors directly — the error transformer (Phase 1) already makes them conversational
- Status values use exact API strings (e.g., "approved", "void") — no friendly aliases or mapping
- Don't hardcode valid statuses in tool descriptions — let users discover via API behavior
- Claude's Discretion: whether to add client-side transition validation or pass through to API

### Entity relationships
- Create tools support copy-from (source_id/source_type) to pre-fill from preceding documents in the sales pipeline (quote → order → delivery order → invoice → payment)
- Copy-from is API-native only — if Bukku's API doesn't support it, don't implement client-side field mapping
- Return raw API responses for list/get — no client-side enrichment of related entity references
- No composite workflow tools — each step is a separate tool call

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-sales-category*
*Context gathered: 2026-02-07*
