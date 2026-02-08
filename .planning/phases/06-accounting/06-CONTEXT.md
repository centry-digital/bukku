# Phase 6: Accounting - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Journal entry and chart of accounts tools with double-entry validation ensuring accounting integrity. Delivers CRUD + list for journal entries and accounts. Does not include reporting, trial balance, or financial statements.

</domain>

<decisions>
## Implementation Decisions

### Double-entry validation
- Pre-validate debits = credits in the MCP tool before sending to Bukku API
- Gives Claude a clear, friendly error message immediately rather than raw API errors
- Error message format: Claude's discretion (should include enough detail for self-correction)
- Minimum line count validation: Claude's discretion on whether to enforce locally or let API handle

### Journal entry structure
- Use the standard CRUD factory pattern (CrudEntityConfig) — same as all other entities
- Line item format and multi-currency support: Claude's discretion based on API spec
- Status workflow (draft/ready/void): Claude's discretion — include update-status tool only if the API supports it

### Chart of accounts behavior
- Factory vs custom tools: Claude's discretion based on API spec
- Delete safeguards: Claude's discretion based on API behavior
- Account type filtering: Claude's discretion — include if the API supports it
- Reference data cache integration: Claude's discretion based on what the API spec shows

### Tool description guidance
- Tool descriptions include validation rules only (debits must equal credits) — NOT common accounting patterns
- Create-journal-entry description must mention using list-accounts first to find valid account IDs (tool chaining guidance)
- Same conversational, task-oriented tone as all existing tools — consistent with Phase 1 decision
- Account type categorization in list-accounts description: Claude's discretion

### Claude's Discretion
- Double-entry error message format (totals only vs totals + line breakdown)
- Whether to enforce minimum 2-line validation locally
- Multi-currency support (depends on API spec)
- Journal entry status workflow (depends on API spec)
- Chart of accounts: factory vs custom, delete guards, type filtering, reference data cache link
- Account type hints in list-accounts description

</decisions>

<specifics>
## Specific Ideas

- Pre-validation should catch balance errors before the API call — this was an explicit choice over letting Bukku handle it
- Tool chaining: create-journal-entry should guide Claude to use list-accounts first — helps the LLM construct valid entries
- Validation rules in descriptions, not accounting patterns — Claude already understands accounting; just tell it the constraints

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-accounting*
*Context gathered: 2026-02-08*
