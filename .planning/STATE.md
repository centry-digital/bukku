# Project State: Bukku MCP Server

**Last updated:** 2026-02-06

## Project Reference

**Core Value:** Claude can read and write accounting data in Bukku reliably, so the user can do bookkeeping work through natural conversation instead of manual data entry.

**Current Focus:** Foundation Infrastructure - Building MCP server with authenticated Bukku API client and tool framework

## Current Position

**Active Phase:** Phase 1 - Foundation Infrastructure
**Active Plan:** 4 of 5 (CRUD Factory and MCP Server)
**Plan Status:** In Progress (4 plans complete: 01-01, 01-02, 01-03, 01-04)
**Current Task:** N/A

**Progress:**
```
[████>                                              ] 4% (0/7 phases complete, 4/5 plans in phase)
```

## Performance Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Phases Complete | 0 | 7 | On Track |
| Plans Complete | 4 | TBD | On Track |
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

### Active TODOs

*No active TODOs yet - awaiting Phase 1 planning*

### Blockers

*No blockers - ready to begin Phase 1 planning*

### Recent Changes

- **2026-02-06:** Completed plan 01-04 (CRUD Factory & MCP Server) - Generic factory pattern generates tools from config, MCP server entry point with stdio transport
- **2026-02-06:** Completed plan 01-03 (TypeScript Types) - Core Bukku API types created
- **2026-02-06:** Completed plan 01-02 (Error Transformation) - HTTP-to-MCP error transformer with conversational messages
- **2026-02-06:** Completed plan 01-01 (Project Scaffold) - TypeScript MCP server with ESM, Zod validation, authenticated HTTP client
- **2026-02-06:** Roadmap created with 7 phases covering 80 v1 requirements

## Session Continuity

**What just happened:** Completed plan 01-04 (CRUD Factory & MCP Server). Built the generic factory pattern that generates MCP tools from CrudEntityConfig objects. Created MCP server entry point with stdio transport and fail-fast startup sequence. Infrastructure is complete - ready for business logic in Phase 2.

**What's next:** Plan 01-05 (if exists) or begin Phase 2 (Sales Domain). Phase 1 foundation is essentially complete - MCP server, authenticated client, error handling, and CRUD factory are all working.

**Context for next session:**
- CRUD factory pattern scales to 55+ tools without duplication - just add CrudEntityConfig objects
- MCP server entry point validates env vars and token before accepting connections
- Tool registry is empty in Phase 1 - Phase 2 adds first entity configs for sales-invoice
- Phase 2 (Sales) validates the patterns with real Bukku API calls and actual business data

---
*State tracking since: 2026-02-06*
