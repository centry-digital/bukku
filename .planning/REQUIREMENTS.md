# Requirements: Bukku MCP Server

**Defined:** 2026-02-06
**Core Value:** Claude can read and write accounting data in Bukku reliably, so the user can do bookkeeping work through natural conversation.

## v1 Requirements

### Infrastructure

- [ ] **INFRA-01**: MCP server starts via stdio transport and connects to Claude Desktop / Claude Code
- [ ] **INFRA-02**: Server authenticates with Bukku API using Bearer token from `BUKKU_API_TOKEN` env var
- [ ] **INFRA-03**: Server sends `Company-Subdomain` header from `BUKKU_COMPANY_SUBDOMAIN` env var on every request
- [ ] **INFRA-04**: Server fails fast with clear error message if required env vars are missing
- [ ] **INFRA-05**: All tool inputs are validated with Zod schemas before API calls
- [ ] **INFRA-06**: HTTP errors are mapped to MCP errors with actionable messages (status code + API error body)
- [ ] **INFRA-07**: List operations support pagination (page, page_size parameters)
- [ ] **INFRA-08**: Server uses CRUD factory pattern to minimize code duplication across ~55 tools

### Sales

- [ ] **SALE-01**: User can list sales quotes with search, date range, status, and pagination filters
- [ ] **SALE-02**: User can create, read, update, and delete a sales quote
- [ ] **SALE-03**: User can update the status of a sales quote (e.g., draft, approved, void)
- [ ] **SALE-04**: User can list sales orders with search, date range, status, and pagination filters
- [ ] **SALE-05**: User can create, read, update, and delete a sales order
- [ ] **SALE-06**: User can update the status of a sales order
- [ ] **SALE-07**: User can list delivery orders with search, date range, status, and pagination filters
- [ ] **SALE-08**: User can create, read, update, and delete a delivery order
- [ ] **SALE-09**: User can update the status of a delivery order
- [ ] **SALE-10**: User can list sales invoices with search, date range, status, and pagination filters
- [ ] **SALE-11**: User can create, read, update, and delete a sales invoice
- [ ] **SALE-12**: User can update the status of a sales invoice
- [ ] **SALE-13**: User can list sales credit notes with search, date range, status, and pagination filters
- [ ] **SALE-14**: User can create, read, update, and delete a sales credit note
- [ ] **SALE-15**: User can update the status of a sales credit note
- [ ] **SALE-16**: User can list sales payments with search, date range, status, and pagination filters
- [ ] **SALE-17**: User can create, read, update, and delete a sales payment
- [ ] **SALE-18**: User can update the status of a sales payment
- [ ] **SALE-19**: User can list sales refunds with search, date range, status, and pagination filters
- [ ] **SALE-20**: User can create, read, update, and delete a sales refund
- [ ] **SALE-21**: User can update the status of a sales refund

### Purchases

- [ ] **PURC-01**: User can list purchase orders with search, date range, status, and pagination filters
- [ ] **PURC-02**: User can create, read, update, and delete a purchase order
- [ ] **PURC-03**: User can update the status of a purchase order
- [ ] **PURC-04**: User can list goods received notes with search, date range, status, and pagination filters
- [ ] **PURC-05**: User can create, read, update, and delete a goods received note
- [ ] **PURC-06**: User can update the status of a goods received note
- [ ] **PURC-07**: User can list purchase bills with search, date range, status, and pagination filters
- [ ] **PURC-08**: User can create, read, update, and delete a purchase bill
- [ ] **PURC-09**: User can update the status of a purchase bill
- [ ] **PURC-10**: User can list purchase credit notes with search, date range, status, and pagination filters
- [ ] **PURC-11**: User can create, read, update, and delete a purchase credit note
- [ ] **PURC-12**: User can update the status of a purchase credit note
- [ ] **PURC-13**: User can list purchase payments with search, date range, status, and pagination filters
- [ ] **PURC-14**: User can create, read, update, and delete a purchase payment
- [ ] **PURC-15**: User can update the status of a purchase payment
- [ ] **PURC-16**: User can list purchase refunds with search, date range, status, and pagination filters
- [ ] **PURC-17**: User can create, read, update, and delete a purchase refund
- [ ] **PURC-18**: User can update the status of a purchase refund

### Banking

- [ ] **BANK-01**: User can list bank incomes with search, date range, and pagination filters
- [ ] **BANK-02**: User can create, read, update, and delete a bank income
- [ ] **BANK-03**: User can list bank expenses with search, date range, and pagination filters
- [ ] **BANK-04**: User can create, read, update, and delete a bank expense
- [ ] **BANK-05**: User can list bank transfers with search, date range, and pagination filters
- [ ] **BANK-06**: User can create, read, update, and delete a bank transfer

### Contacts

- [ ] **CONT-01**: User can list contacts with search and pagination filters
- [ ] **CONT-02**: User can create, read, update, and delete a contact
- [ ] **CONT-03**: User can list contact groups with pagination
- [ ] **CONT-04**: User can create, read, update, and delete a contact group

### Products

- [ ] **PROD-01**: User can list products with search and pagination filters
- [ ] **PROD-02**: User can create, read, update, and delete a product
- [ ] **PROD-03**: User can list product bundles with pagination
- [ ] **PROD-04**: User can create, read, update, and delete a product bundle
- [ ] **PROD-05**: User can list product groups with pagination
- [ ] **PROD-06**: User can create, read, update, and delete a product group

### Accounting

- [ ] **ACCT-01**: User can list journal entries with search, date range, and pagination filters
- [ ] **ACCT-02**: User can create, read, update, and delete a journal entry
- [ ] **ACCT-03**: User can list chart of accounts with pagination
- [ ] **ACCT-04**: User can create, read, update, and delete an account

### Lists

- [ ] **LIST-01**: User can retrieve reference data lists (tax codes, currencies, payment methods, etc.)
- [ ] **LIST-02**: Reference data responses are cached to reduce API calls (5-minute TTL)

### Files

- [ ] **FILE-01**: User can list files with pagination
- [ ] **FILE-02**: User can read file metadata by ID

### Control Panel

- [ ] **CTRL-01**: User can list locations with pagination
- [ ] **CTRL-02**: User can create, read, update, and delete a location
- [ ] **CTRL-03**: User can list tags with pagination
- [ ] **CTRL-04**: User can create, read, update, and delete a tag
- [ ] **CTRL-05**: User can list tag groups with pagination
- [ ] **CTRL-06**: User can create, read, update, and delete a tag group

### Developer Experience

- [ ] **DEVX-01**: README with setup instructions (env vars, Claude Desktop config, usage examples)
- [ ] **DEVX-02**: Each tool has a clear, LLM-readable description (task-oriented, front-loaded)
- [ ] **DEVX-03**: TypeScript types generated or derived from Bukku OpenAPI specs

## v2 Requirements

### Enhanced Features

- **ENH-01**: Structured JSON logging with request IDs, tool names, and timing
- **ENH-02**: Connection test tool to verify auth + API health
- **ENH-03**: Retry logic with exponential backoff for transient 5xx errors
- **ENH-04**: Rate limit management with token bucket pattern
- **ENH-05**: Smart defaults (auto-populate currency, default tax code from company settings)
- **ENH-06**: MCP resources for Lists reference data (instead of tools)

### Advanced Features

- **ADV-01**: Intent-based composite tools for common workflows
- **ADV-02**: Batch operations for bulk creates/updates
- **ADV-03**: Field-level validation against Bukku business rules

## Out of Scope

| Feature | Reason |
|---------|--------|
| npm package publishing | Local-only usage; avoid publish overhead |
| MyInvois e-invoicing | No direct API endpoints; docs/setup only |
| HTTP/SSE transport | Security risk for accounting data; stdio sufficient for local use |
| Real-time webhooks | MCP is request-response; polling via list ops sufficient |
| Multi-company in single session | One subdomain per config; run multiple instances |
| Data synchronization/replication | MCP fetches on-demand; no local data store |
| Custom business logic | Let Claude handle business rules via tool calls |
| GraphQL-style field selection | REST API returns full responses; LLM ignores irrelevant fields |
| Undo/rollback operations | Accounting requires audit trail; expose void/delete as-is |

## Traceability

*Populated during roadmap creation.*

| Requirement | Phase | Status |
|-------------|-------|--------|
| — | — | — |

**Coverage:**
- v1 requirements: 67 total
- Mapped to phases: 0
- Unmapped: 67

---
*Requirements defined: 2026-02-06*
*Last updated: 2026-02-06 after initial definition*
