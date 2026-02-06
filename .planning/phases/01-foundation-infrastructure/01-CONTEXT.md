# Phase 1: Foundation Infrastructure - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Working MCP server with authenticated Bukku API client, error transformation, Zod validation, CRUD factory pattern, and TypeScript types from OpenAPI specs. This phase delivers the scaffolding that all subsequent tool phases build on. No actual business-domain tools (sales, purchases, etc.) are built here.

</domain>

<decisions>
## Implementation Decisions

### Error message style
- Conversational tone — errors should read naturally in Claude's response (e.g., "Couldn't create the invoice — Bukku says the contact ID doesn't exist. Want me to look up the right contact?")
- Always suggest a next step — every error includes what Claude could do to help fix it
- Auth failures get prominent, distinct treatment — clear callout like "Your Bukku token may be invalid. Check BUKKU_API_TOKEN."
- Multiple validation errors shown all at once — present every field error together so user can fix in one go

### Tool naming & descriptions
- Kebab-case without prefix: `list-sales-invoices`, `create-sales-invoice`, `get-sales-invoice`
- Relies on MCP server name for namespace context
- Concise one-liner descriptions: "List sales invoices with optional filters"
- Separate tools per CRUD action — 4 tools per entity (create, get, update, delete) plus list
- Dedicated status tools — `update-sales-invoice-status` separate from `update-sales-invoice`

### Configuration & setup
- Environment variables only — `BUKKU_API_TOKEN` and `BUKKU_COMPANY_SUBDOMAIN`
- No .env file support, no config file
- Immediate crash with checklist on missing config — exit with clear output showing what's missing
- Validate token on startup — make a lightweight Bukku API call to confirm token works before accepting tool calls
- README should be a step-by-step guide — full walkthrough including how to get Bukku API token, Claude Desktop config JSON, and first usage example

### Claude's Discretion
- Type generation approach (auto-generate vs hand-craft from OpenAPI specs)
- Whether OpenAPI specs stay checked in as source of truth or serve as reference only
- Type strictness level (strict vs pragmatic coverage)
- Zod schema source (derived from OpenAPI or written separately)
- Exact error message wording and formatting
- Loading/progress indicators during API calls
- CRUD factory pattern internal architecture

</decisions>

<specifics>
## Specific Ideas

- User has 11 OpenAPI spec files in `.api-specs/` covering all Bukku API categories (sales.yaml, purchase.yaml, contacts.yaml, etc.)
- Tool naming convention should feel natural in conversation — kebab-case reads well when Claude mentions tools
- Error messages should feel like a helpful colleague, not a log file
- The factory pattern needs to scale to ~55 tools across 9 categories without code duplication

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-infrastructure*
*Context gathered: 2026-02-06*
