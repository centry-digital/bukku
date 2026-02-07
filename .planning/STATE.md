# Project State: Bukku MCP Server

**Last updated:** 2026-02-07

## Project Reference

**Core Value:** Claude can read and write accounting data in Bukku reliably, so the user can do bookkeeping work through natural conversation instead of manual data entry.

**Current Focus:** Sales Category Implementation - Adding all 7 sales transaction entities to MCP server

## Current Position

**Active Phase:** Phase 2 - Sales Category
**Active Plan:** 2 of 3 (Tool Registry Wiring - COMPLETE)
**Plan Status:** In progress (2 plans complete: 02-01, 02-02)
**Current Task:** N/A
**Last activity:** 2026-02-07 - Completed 02-02-PLAN.md

**Progress:**
```
[██████>                                            ] 10% (0/7 phases complete, 2/3 plans in phase 2)
```

## Performance Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Phases Complete | 0 | 7 | On Track |
| Plans Complete | 6 | TBD | On Track |
| Requirements Delivered | 0 | 80 | On Track |
| Blockers | 0 | 0 | Green |

## Accumulated Context

### Key Decisions

| Phase-Plan | Decision | Rationale | Impact |
|------------|----------|-----------|--------|
| 01-01 | Use ESM (type: module) for Node16 module resolution | Modern Node.js compatibility and better tree-shaking | Foundation for all modules |
| 01-01 | Fail-fast on missing environment variables with setup checklist | Invalid/missing credentials cause immediate process.exit(1) | Prevents silent auth failures, clearer debugging |
| 01-01 | Validate token on startup via /contacts endpoint | Verify token works before serving tools | Early detection of auth issues |
| 01-01 | All logging goes to stderr to preserve MCP stdio protocol | stdout reserved for protocol messages | MCP protocol compliance |
| 01-02 | Conversational tone for all error messages | Messages relayed by Claude should sound helpful, not technical | User experience improvement |
| 01-02 | 401 errors mention BUKKU_API_TOKEN explicitly | Authentication is critical - make troubleshooting obvious | Faster debugging |
| 01-02 | Show all validation errors at once | Avoid whack-a-mole iteration cycles | Better developer experience |
| 01-02 | Use Node.js built-in test runner | Zero test dependencies with native TypeScript support | Simpler dependency management |
| 01-03 | Hand-craft types from OpenAPI specs | OpenAPI specs have missing $ref files, auto-gen would fail | Types accurate, verified against schemas |
| 01-03 | Use generic response wrappers (BukkuPaginatedResponse<T>, BukkuSingleResponse<T>) | All Bukku endpoints follow same pattern | Supports all 55+ entities without duplication |
| 01-03 | Include CrudEntityConfig interface | Factory needs type-safe configuration | Prevents config errors in tool generation |
| 01-04 | Factory generates tools with kebab-case names without prefix | Per locked decision: list-sales-invoices, not list_sales_invoices | Consistent naming across all 55+ tools |
| 01-04 | Dedicated update-status tools for entities that support status changes | Status updates are common operations, deserve dedicated tools | Clearer tool purpose vs generic update |
| 01-04 | Registry is empty in Phase 1, configs added in Phase 2+ | Complete infrastructure first, add business logic incrementally | Phase 1 validates architecture without entity code |
| 01-04 | Use z.record(z.string(), z.unknown()) for flexible data inputs | Create/update tools accept any fields to forward to Bukku API | Maximum flexibility - Bukku API validates fields |
| 02-01 | Entity-specific list filters per OpenAPI spec | Each entity config declares its own listFilters array | Different sales entities support different filter parameters (invoice has payment_status, payment has payment_mode, etc.) |
| 02-01 | All 7 sales entities support uniform operations | All configs enable all 5 CRUD operations + status updates | OpenAPI spec shows all sales transaction types support full CRUD + status changes |
| 02-02 | Sequential registration over loop for entity configs | Explicit calls to registerCrudTools for each config | Easier to read, debug, and maintain. Clear tool count tracking per entity |

### Active TODOs

*No active TODOs yet - awaiting Phase 1 planning*

### Blockers

*No blockers - ready to begin Phase 1 planning*

### Recent Changes

- **2026-02-07:** Completed plan 02-02 (Tool Registry Wiring) - Wired all 7 sales entity configs into registry, producing 42 working MCP tools
- **2026-02-07:** Completed plan 02-01 (Sales Entity Configurations) - Created 7 CrudEntityConfig objects for all sales transaction types, ready for registry wiring
- **2026-02-06:** Completed plan 01-04 (CRUD Factory & MCP Server) - Generic factory pattern generates tools from config, MCP server entry point with stdio transport
- **2026-02-06:** Completed plan 01-03 (TypeScript Types) - Core Bukku API types created
- **2026-02-06:** Completed plan 01-02 (Error Transformation) - HTTP-to-MCP error transformer with conversational messages

## Session Continuity

**Last session:** 2026-02-07 11:27 UTC
**Stopped at:** Completed 02-02-PLAN.md
**Resume file:** None

**What just happened:** Completed plan 02-02 (Tool Registry Wiring). Updated src/tools/registry.ts to import and register all 7 sales entity configs. Each config generates 6 tools via the factory pattern, producing 42 total MCP tools. Build passes, existing tests pass, all tools ready for use.

**What's next:** Plan 02-03 will test these 42 tools against the actual Bukku API to verify end-to-end functionality.

**Context for next session:**
- 42 MCP tools registered: 7 sales entities × 6 operations (list, get, create, update, delete, update-status)
- Tool names follow kebab-case: list-sales-invoices, create-delivery-order, update-sales-payment-status, etc.
- All tools use entity-specific filters from config (invoice has payment_status, payment has payment_mode, etc.)
- Build output in build/ includes all transpiled configs and updated registry
- Server startup will log "42 tools registered" when run
- Next plan needs to validate these tools work against real Bukku API endpoints

---
*State tracking since: 2026-02-06*
