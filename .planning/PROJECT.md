# Bukku MCP Server

## What This Is

An MCP (Model Context Protocol) server that exposes the full Bukku accounting platform API as 169 tools for Claude. Enables AI-assisted bookkeeping -- creating invoices, recording payments, managing contacts, reconciling bank transactions, and more -- directly through Claude Code or Claude Desktop with Cowork.

## Core Value

Claude can read and write accounting data in Bukku reliably, so the user can do bookkeeping work through natural conversation instead of manual data entry.

## Requirements

### Validated

- ✓ MCP server exposing all Bukku API endpoints as 169 separate tools -- v1.0
- ✓ Sales tools: quotes, orders, delivery orders, invoices, credit notes, payments, refunds (CRUD + list + status) -- v1.0
- ✓ Purchase tools: orders, GRNs, bills, credit notes, payments, refunds (CRUD + list + status) -- v1.0
- ✓ Banking tools: incomes, expenses, transfers (CRUD + list + status) -- v1.0
- ✓ Contact tools: contacts and contact groups (CRUD + list + archive) -- v1.0
- ✓ Product tools: products, bundles, product groups (CRUD + list + archive) -- v1.0
- ✓ Accounting tools: journal entries with double-entry validation, chart of accounts (CRUD + list + search) -- v1.0
- ✓ Lists tool: 10 reference data types with 5-minute cache (tax codes, currencies, payment methods, etc.) -- v1.0
- ✓ Files tools: list, get metadata, upload via multipart/form-data -- v1.0
- ✓ Control Panel tools: locations (CRUD + archive), tags, tag groups (CRUD) -- v1.0
- ✓ Bearer token authentication via environment variables -- v1.0
- ✓ CRUD factory pattern generating tools from entity configs -- v1.0
- ✓ Business rules embedded in tool descriptions for proactive LLM guidance -- v1.0

### Active

(None yet -- define in next milestone)

### Out of Scope

- npm package publishing -- local-only usage for now
- MyInvois e-invoicing API -- no direct API endpoints available
- HTTP/SSE transport -- security risk for accounting data; stdio sufficient
- Multi-company switching within a single session -- one subdomain per config
- Tag/tag-group archive operations -- Bukku API has no PATCH endpoints for these

## Context

Shipped v1.0 with 4,003 LOC TypeScript across 141 files.
Tech stack: TypeScript, Node.js, @modelcontextprotocol/sdk, Zod.
Transport: stdio (standard for local MCP servers).
API: Bukku REST API v1.0 at api.bukku.my with Bearer token + Company-Subdomain header.
Tool count: 169 tools (42 sales + 36 purchases + 30 banking/contacts + 28 products/lists + 13 accounting + 20 files/control-panel).
Test suite: 28 tests (double-entry validation), Node.js built-in test runner.

## Constraints

- **Tech stack**: TypeScript with Node.js -- aligns with MCP SDK ecosystem
- **Auth**: Environment variables only (`BUKKU_API_TOKEN`, `BUKKU_COMPANY_SUBDOMAIN`) -- no config file
- **API limits**: Bukku recommends consolidated daily entries for high-volume transactions
- **Transport**: MCP stdio transport (standard for local MCP servers)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Separate tools per operation | Better discoverability for Claude, clearer tool descriptions | ✓ Good -- 169 tools work well |
| TypeScript + MCP SDK | Best SDK support, type safety for API contracts | ✓ Good -- zero runtime type errors |
| Environment variables for auth | Simple, secure, standard for MCP servers | ✓ Good -- works with Claude Desktop + Claude Code |
| No safety guardrails on destructive ops | User trusts their workflow, full API access needed | ✓ Good -- no complaints |
| Local-only distribution | Simpler setup, no publish overhead needed | ✓ Good -- sufficient for now |
| CRUD factory pattern | Minimize code duplication across 27 entity configs | ✓ Good -- 169 tools from ~4K LOC |
| Business rules in tool descriptions | Proactive guidance prevents invalid operations | ✓ Good -- Claude avoids impossible recovery actions |
| Hand-crafted types from OpenAPI specs | Auto-gen would fail due to missing $ref files | ✓ Good -- types accurate and verified |
| Reference data caching (5-min TTL) | Reduce redundant API calls during sessions | ✓ Good -- transparent performance improvement |
| Double-entry validation with epsilon tolerance | Floating-point precision for currency amounts | ✓ Good -- catches unbalanced entries with conversational errors |
| File path input for upload tool | Most practical for MCP context | ✓ Good -- Claude can reference local files |
| Node.js built-in test runner | Zero test dependencies | ✓ Good -- native TypeScript support |

---
*Last updated: 2026-02-09 after v1.0 milestone*
