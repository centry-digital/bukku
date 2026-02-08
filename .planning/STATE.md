# Project State: Bukku MCP Server

**Last updated:** 2026-02-08

## Project Reference

**Core Value:** Claude can read and write accounting data in Bukku reliably, so the user can do bookkeeping work through natural conversation instead of manual data entry.

**Current Focus:** Phase 3 (Purchases Category) complete — ready for Phase 4 (Contacts & Banking Category)

## Current Position

**Active Phase:** Phase 3 - Purchases Category (COMPLETE)
**Active Plan:** 3 of 3 (all plans complete)
**Plan Status:** Phase complete
**Current Task:** N/A
**Last activity:** 2026-02-08 - Completed 03-03-PLAN.md (Purchase Registry Wiring)

**Progress:**
```
[██████████████████>                               ] 30% (3/7 phases complete, ready for phase 4)
```

## Performance Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Phases Complete | 3 | 7 | On Track |
| Plans Complete | 11 | TBD | On Track |
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
| 02-03 | Business rules in tool descriptions (proactive) not error messages (reactive) | LLM reads tool descriptions before calling tools, enabling correct decisions upfront | Prevents invalid recovery suggestions like reverting ready invoices to draft |
| 02-03 | businessRules field is optional on CrudEntityConfig | Backward compatibility with configs that lack rules | Non-breaking change, future entity categories can adopt incrementally |

### Active TODOs

*None - Phase 3 fully complete*

### Blockers

*No blockers - ready for Phase 4 (Contacts & Banking Category)*

### Recent Changes

- **2026-02-08:** Completed plan 03-03 (Purchase Registry Wiring) - Wired all 6 purchase entity configs into registry, producing 78 total working MCP tools (42 sales + 36 purchases)
- **2026-02-08:** Completed plan 03-02 (Purchase Entity Configurations) - Created 6 purchase entity configs with corrected business rules
- **2026-02-08:** Completed plan 03-01 (Correct Sales Business Rules) - Fixed delete constraints (draft+void) and added pending_approval status to all 7 sales entity configs
- **2026-02-08:** Completed plan 02-03 (GAP-01 Closure) - Business-rule context embedded in MCP tool descriptions for delete constraints and status lifecycle
- **2026-02-07:** Completed plan 02-02 (Tool Registry Wiring) - Wired all 7 sales entity configs into registry, producing 42 working MCP tools
- **2026-02-07:** Completed plan 02-01 (Sales Entity Configurations) - Created 7 CrudEntityConfig objects for all sales transaction types, ready for registry wiring

## Session Continuity

**Last session:** 2026-02-08
**Stopped at:** Phase 3 complete (all 3 plans done)
**Resume file:** .planning/phases/03-purchases-category/03-03-SUMMARY.md

**What just happened:** Executed plan 03-03 (Purchase Registry Wiring). Wired all 6 purchase entity configs into tool registry. MCP server now produces 78 working tools (42 sales + 36 purchases). Build and all tests pass (10/10). Phase 3 complete.

**What's next:** Phase 4 (Contacts & Banking Category) — add contact, banking account, and banking transaction entity configs.

**Context for next session:**
- Phase 3 complete: 78 working MCP tools across sales and purchases categories
- All purchase entities follow corrected business rules from plan 03-01
- Sequential registration pattern maintained in registry.ts
- Proven CRUD factory pattern ready for rapid entity additions
- Commit: 975ef7b (feat(03-03): wire purchase entity configs into tool registry)

---
*State tracking since: 2026-02-06*
