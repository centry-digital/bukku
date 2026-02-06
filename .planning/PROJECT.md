# Bukku MCP Server

## What This Is

An MCP (Model Context Protocol) server that exposes the Bukku accounting platform's API as tools for Claude. This enables AI-assisted bookkeeping — creating invoices, recording payments, managing contacts, reconciling bank transactions, and more — directly through Claude Code or Claude Desktop with Cowork.

## Core Value

Claude can read and write accounting data in Bukku reliably, so the user can do bookkeeping work through natural conversation instead of manual data entry.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] MCP server exposing all Bukku API endpoints as separate tools
- [ ] Sales tools: quotes, orders, delivery orders, invoices, credit notes, payments, refunds (CRUD + list + status)
- [ ] Purchase tools: orders, GRNs, bills, credit notes, payments, refunds (CRUD + list + status)
- [ ] Banking tools: incomes, expenses, transfers (CRUD + list)
- [ ] Contact tools: contacts and contact groups (CRUD + list)
- [ ] Product tools: products, bundles, product groups (CRUD + list)
- [ ] Accounting tools: journal entries, chart of accounts (CRUD + list)
- [ ] Lists tool: reference data (tax codes, currencies, payment methods, etc.)
- [ ] Files tools: upload and download files
- [ ] Control Panel tools: locations, tags, tag groups (CRUD + list)
- [ ] Bearer token authentication via environment variables
- [ ] Production API server support (api.bukku.my)

### Out of Scope

- npm package publishing — local-only usage for now
- MyInvois e-invoicing API — no direct API endpoints available, documentation/setup only
- Custom UI or dashboard — this is a headless MCP server
- Multi-company switching within a single session — one subdomain per config

## Context

- **Platform**: Bukku is a cloud-based accounting software for Malaysian SMEs and accountants
- **API version**: v1.0, REST-based with OpenAPI specs available
- **Authentication**: Bearer token + `Company-Subdomain` header on every request
- **API servers**: Production at `https://api.bukku.my`, Staging at `https://api.bukku.fyi`
- **API specs**: Downloaded to `.api-specs/` directory (YAML format, Redocly-generated)
- **Endpoint count**: ~55 endpoints across 9 categories (Sales, Purchases, Banking, Contacts, Products, Accounting, Lists, Files, Control Panel)
- **Tool design**: Each API operation becomes a separate MCP tool (e.g., `list_sales_invoices`, `create_sales_invoice`, `get_sales_invoice`)
- **Usage**: Primary use via Claude Code CLI and Claude Desktop with Cowork for day-to-day bookkeeping

## Constraints

- **Tech stack**: TypeScript with Node.js — aligns with MCP SDK ecosystem
- **Auth**: Environment variables only (`BUKKU_API_TOKEN`, `BUKKU_COMPANY_SUBDOMAIN`) — no config file
- **API limits**: Bukku recommends consolidated daily entries for high-volume transactions to prevent system slowdowns
- **Transport**: MCP stdio transport (standard for local MCP servers)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Separate tools per operation | Better discoverability for Claude, clearer tool descriptions | — Pending |
| TypeScript + MCP SDK | Best SDK support, type safety for API contracts | — Pending |
| Environment variables for auth | Simple, secure, standard for MCP servers | — Pending |
| No safety guardrails on destructive ops | User trusts their workflow, full API access needed | — Pending |
| Local-only distribution | Simpler setup, no publish overhead needed | — Pending |
| Production-first | User connecting to live data immediately | — Pending |

---
*Last updated: 2026-02-06 after initialization*
