# Phase 5: Products & Lists - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Product catalog tools (products, bundles, groups) and reference data access (tax codes, currencies, payment methods, etc.) enabling inventory-aware invoicing. Full CRUD for all entities including reference data. Caching for reference data with 5-minute TTL.

</domain>

<decisions>
## Implementation Decisions

### Reference data caching
- Claude's discretion on cache visibility (transparent vs explicit refresh) and cache storage approach
- 5-minute TTL as specified in roadmap
- Claude's discretion on whether to cache product listings in addition to reference data
- Stale data is "somewhat important" — if user creates a new tax code in Bukku web UI mid-session, a way to get fresh data would be nice but not critical

### List tool design
- Claude's discretion on whether to expose one tool per reference list or a single lookup tool with type parameter
- Researcher should discover all available reference lists from OpenAPI specs and recommend which to expose
- Full CRUD for reference data (not read-only) — users may want to manage everything through Claude
- Auto-lookup behavior: Claude should use context to decide when to proactively fetch reference data vs ask the user. When instructions are unclear or vague, check with the user rather than assuming

### Product data shape
- Let Bukku API validate bundle relationships — same pass-through pattern as sales/purchases
- Researcher should discover product-specific business rules and constraints from API specs before deciding what to embed in tool descriptions
- Researcher should discover all available product list filters from OpenAPI spec
- Researcher should discover how product groups relate to products in the API

### Tool naming & grouping
- Same CRUD naming pattern for reference data tools (list-tax-codes, create-tax-code) — consistent with all other tools
- Use factory pattern (CrudEntityConfig) for reference data tools, same as products/sales/purchases
- Not concerned about tool count — expose everything the API offers
- Cross-reference related tools in descriptions (e.g., "Use list-tax-codes to find valid tax codes before creating invoices")

### Claude's Discretion
- Cache implementation approach (transparent vs explicit refresh, in-memory vs persisted, scope)
- One-tool-per-list vs single lookup tool for reference data
- Whether to cache product listings alongside reference data
- Product filter selection (after research reveals what's available)

</decisions>

<specifics>
## Specific Ideas

- "Determine what's right based on context. If unsure due to unclear/vague instructions, check with user" — this applies to auto-lookup behavior when Claude needs to pick tax codes, currencies, etc.
- Cross-reference tool descriptions to help Claude chain workflows (e.g., look up tax codes before creating invoices)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-products-lists*
*Context gathered: 2026-02-08*
