# Roadmap: Bukku MCP Server

**Created:** 2026-02-06
**Depth:** Standard (7 phases)
**Coverage:** 80/80 v1 requirements mapped

## Overview

This roadmap delivers a Model Context Protocol (MCP) server that exposes all Bukku accounting API operations as tools for Claude. The structure follows architectural dependencies: foundation infrastructure enables tool framework validation via sales proof-of-concept, then scales to all categories systematically, addressing accounting-specific complexity (double-entry validation) before auxiliary features (files, control panel).

## Phases

### Phase 1: Foundation Infrastructure

**Goal:** Working MCP server with authenticated Bukku API client and error transformation ready for tool development

**Dependencies:** None (foundation phase)

**Plans:** 5 plans

Plans:
- [ ] 01-01-PLAN.md -- Project scaffold, env validation, and authenticated Bukku HTTP client
- [ ] 01-02-PLAN.md -- HTTP-to-MCP error transformation (TDD)
- [ ] 01-03-PLAN.md -- TypeScript types from OpenAPI specs
- [ ] 01-04-PLAN.md -- CRUD factory pattern, tool registry, and MCP server entry point
- [ ] 01-05-PLAN.md -- README setup guide and end-to-end verification

**Requirements:**
- INFRA-01: MCP server starts via stdio transport and connects to Claude Desktop / Claude Code
- INFRA-02: Server authenticates with Bukku API using Bearer token from `BUKKU_API_TOKEN` env var
- INFRA-03: Server sends `Company-Subdomain` header from `BUKKU_COMPANY_SUBDOMAIN` env var on every request
- INFRA-04: Server fails fast with clear error message if required env vars are missing
- INFRA-05: All tool inputs are validated with Zod schemas before API calls
- INFRA-06: HTTP errors are mapped to MCP errors with actionable messages (status code + API error body)
- INFRA-07: List operations support pagination (page, page_size parameters)
- INFRA-08: Server uses CRUD factory pattern to minimize code duplication across ~55 tools
- DEVX-01: README with setup instructions (env vars, Claude Desktop config, usage examples)
- DEVX-02: Each tool has a clear, LLM-readable description (task-oriented, front-loaded)
- DEVX-03: TypeScript types generated or derived from Bukku OpenAPI specs

**Success Criteria:**
1. User can install dependencies and start the MCP server using stdio transport
2. Server connects to Claude Desktop and appears in available tools list
3. Server authenticates successfully with Bukku API using environment variables
4. Missing or invalid environment variables produce clear, actionable error messages
5. HTTP errors from Bukku API are transformed into structured MCP errors with what/why/how-to-fix context

**Status:** Pending

---

### Phase 2: Sales Category (Proof of Concept)

**Goal:** Complete sales workflow tools validated end-to-end, establishing factory pattern and tool description standards for scaling

**Dependencies:** Phase 1 (requires API client, MCP server, tool framework)

**Requirements:**
- SALE-01: User can list sales quotes with search, date range, status, and pagination filters
- SALE-02: User can create, read, update, and delete a sales quote
- SALE-03: User can update the status of a sales quote (e.g., draft, approved, void)
- SALE-04: User can list sales orders with search, date range, status, and pagination filters
- SALE-05: User can create, read, update, and delete a sales order
- SALE-06: User can update the status of a sales order
- SALE-07: User can list delivery orders with search, date range, status, and pagination filters
- SALE-08: User can create, read, update, and delete a delivery order
- SALE-09: User can update the status of a delivery order
- SALE-10: User can list sales invoices with search, date range, status, and pagination filters
- SALE-11: User can create, read, update, and delete a sales invoice
- SALE-12: User can update the status of a sales invoice
- SALE-13: User can list sales credit notes with search, date range, status, and pagination filters
- SALE-14: User can create, read, update, and delete a sales credit note
- SALE-15: User can update the status of a sales credit note
- SALE-16: User can list sales payments with search, date range, status, and pagination filters
- SALE-17: User can create, read, update, and delete a sales payment
- SALE-18: User can update the status of a sales payment
- SALE-19: User can list sales refunds with search, date range, status, and pagination filters
- SALE-20: User can create, read, update, and delete a sales refund
- SALE-21: User can update the status of a sales refund

**Success Criteria:**
1. User can create a complete sales workflow: quote to order to delivery order to invoice to payment
2. User can search and filter sales documents by date range, status, and keywords with pagination
3. User can transition sales documents through status workflows (draft, approved, void)
4. Claude can correctly select the appropriate sales tool based on natural language requests
5. All sales tools provide clear error messages when operations fail (validation, API errors)

**Status:** Pending

---

### Phase 3: Purchases Category

**Goal:** Complete purchasing workflow tools using validated patterns from Phase 2

**Dependencies:** Phase 2 (reuses factory pattern, tool description standards)

**Requirements:**
- PURC-01: User can list purchase orders with search, date range, status, and pagination filters
- PURC-02: User can create, read, update, and delete a purchase order
- PURC-03: User can update the status of a purchase order
- PURC-04: User can list goods received notes with search, date range, status, and pagination filters
- PURC-05: User can create, read, update, and delete a goods received note
- PURC-06: User can update the status of a goods received note
- PURC-07: User can list purchase bills with search, date range, status, and pagination filters
- PURC-08: User can create, read, update, and delete a purchase bill
- PURC-09: User can update the status of a purchase bill
- PURC-10: User can list purchase credit notes with search, date range, status, and pagination filters
- PURC-11: User can create, read, update, and delete a purchase credit note
- PURC-12: User can update the status of a purchase credit note
- PURC-13: User can list purchase payments with search, date range, status, and pagination filters
- PURC-14: User can create, read, update, and delete a purchase payment
- PURC-15: User can update the status of a purchase payment
- PURC-16: User can list purchase refunds with search, date range, status, and pagination filters
- PURC-17: User can create, read, update, and delete a purchase refund
- PURC-18: User can update the status of a purchase refund

**Success Criteria:**
1. User can create a complete purchasing workflow: order to GRN to bill to payment
2. User can search and filter purchase documents by date range, status, and keywords with pagination
3. User can transition purchase documents through status workflows (draft, approved, void)
4. Purchase tools mirror sales patterns for consistency (same filter options, status transitions)

**Status:** Pending

---

### Phase 4: Banking & Contacts

**Goal:** Banking transaction tools and contact management enabling financial reconciliation workflows

**Dependencies:** Phase 2 (reuses factory pattern)

**Requirements:**
- BANK-01: User can list bank incomes with search, date range, and pagination filters
- BANK-02: User can create, read, update, and delete a bank income
- BANK-03: User can list bank expenses with search, date range, and pagination filters
- BANK-04: User can create, read, update, and delete a bank expense
- BANK-05: User can list bank transfers with search, date range, and pagination filters
- BANK-06: User can create, read, update, and delete a bank transfer
- CONT-01: User can list contacts with search and pagination filters
- CONT-02: User can create, read, update, and delete a contact
- CONT-03: User can list contact groups with pagination
- CONT-04: User can create, read, update, and delete a contact group

**Success Criteria:**
1. User can record bank transactions (incomes, expenses, transfers) with date range filtering
2. User can reconcile bank statements by listing and matching transactions
3. User can create and manage customer/supplier contacts before creating sales/purchase documents
4. User can organize contacts into groups for categorization

**Status:** Pending

---

### Phase 5: Products & Lists

**Goal:** Product catalog tools and reference data access enabling inventory-aware invoicing

**Dependencies:** Phase 2 (reuses factory pattern)

**Requirements:**
- PROD-01: User can list products with search and pagination filters
- PROD-02: User can create, read, update, and delete a product
- PROD-03: User can list product bundles with pagination
- PROD-04: User can create, read, update, and delete a product bundle
- PROD-05: User can list product groups with pagination
- PROD-06: User can create, read, update, and delete a product group
- LIST-01: User can retrieve reference data lists (tax codes, currencies, payment methods, etc.)
- LIST-02: Reference data responses are cached to reduce API calls (5-minute TTL)

**Success Criteria:**
1. User can create products and bundles before adding them to invoices
2. User can search product catalog and organize products into groups
3. User can retrieve tax codes, currencies, and payment methods for invoice creation
4. Reference data is cached to avoid redundant API calls within 5-minute windows

**Status:** Pending

---

### Phase 6: Accounting

**Goal:** Journal entry and chart of accounts tools with double-entry validation ensuring accounting integrity

**Dependencies:** Phase 2 (reuses factory pattern), Phase 5 (needs reference data for account types)

**Requirements:**
- ACCT-01: User can list journal entries with search, date range, and pagination filters
- ACCT-02: User can create, read, update, and delete a journal entry
- ACCT-03: User can list chart of accounts with pagination
- ACCT-04: User can create, read, update, and delete an account

**Success Criteria:**
1. User can create journal entries that automatically validate double-entry rules (debits = credits)
2. User receives structured error messages when journal entries are unbalanced with debit/credit totals
3. User can view and modify the chart of accounts structure
4. Journal entry creation references valid accounts from the chart of accounts

**Status:** Pending

---

### Phase 7: Files & Control Panel

**Goal:** File attachment and company configuration tools completing full API surface coverage

**Dependencies:** Phase 2 (reuses factory pattern)

**Requirements:**
- FILE-01: User can list files with pagination
- FILE-02: User can read file metadata by ID
- CTRL-01: User can list locations with pagination
- CTRL-02: User can create, read, update, and delete a location
- CTRL-03: User can list tags with pagination
- CTRL-04: User can create, read, update, and delete a tag
- CTRL-05: User can list tag groups with pagination
- CTRL-06: User can create, read, update, and delete a tag group

**Success Criteria:**
1. User can list and view metadata for files attached to documents
2. User can manage company locations for multi-branch accounting
3. User can create and organize tags for categorizing transactions and documents
4. All 80 v1 requirements are deliverable through MCP tools

**Status:** Pending

---

## Progress

| Phase | Requirements | Status | Plans | Completed Plans |
|-------|--------------|--------|-------|-----------------|
| 1 - Foundation Infrastructure | 11 | Pending | 5 | 0 |
| 2 - Sales Category | 21 | Pending | 0 | 0 |
| 3 - Purchases Category | 18 | Pending | 0 | 0 |
| 4 - Banking & Contacts | 10 | Pending | 0 | 0 |
| 5 - Products & Lists | 8 | Pending | 0 | 0 |
| 6 - Accounting | 4 | Pending | 0 | 0 |
| 7 - Files & Control Panel | 8 | Pending | 0 | 0 |

**Total:** 80 requirements across 7 phases

---
*Last updated: 2026-02-06*
